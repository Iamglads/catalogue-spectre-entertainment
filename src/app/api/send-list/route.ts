import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId, type Document } from 'mongodb';

type SendListBody = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  items: Array<{ id: string; quantity: number }>;
  postalCode?: string;
  deliveryMethod?: 'pickup' | 'delivery';
  address?: { line1: string; line2?: string; city: string; province: string; postalCode: string };
};

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'info@spectre-entertainment.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'Catalogue';
    const adminEmail = process.env.BREVO_ADMIN_EMAIL || 'logistique@spectre-entertainment.com';
    if (!apiKey) {
      return NextResponse.json({ error: 'Brevo env vars missing' }, { status: 500 });
    }

    const body = (await req.json()) as SendListBody;
    if (!body?.email || !body?.name || !Array.isArray(body?.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const ids: ObjectId[] = [];
    for (const it of body.items) {
      try { ids.push(new ObjectId(it.id)); } catch {}
    }
    if (ids.length === 0) {
      return NextResponse.json({ error: 'No valid ids' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const products = db.collection<Document>('products');
    const docs = await products.find(
      {
        _id: { $in: ids },
        visibility: 'visible',
        $or: [ { 'raw.Publié': 1 }, { 'raw.Publié': '1' } ],
      },
      { projection: { name: 1, images: 1, shortDescription: 1, lengthInches: 1, widthInches: 1, heightInches: 1, regularPrice: 1, salePrice: 1 } }
    ).toArray();

    const qtyMap = new Map(body.items.map((i) => [i.id, Math.max(1, Number(i.quantity) || 1)]));

    const rows = docs.map((d) => {
      const id = String(d._id);
      const q = qtyMap.get(id) ?? 1;
      const doc = d as Record<string, unknown>;
      const dims = [doc.lengthInches, doc.widthInches, doc.heightInches].some(Boolean)
        ? `Dim.: ${doc.lengthInches ?? '—'} × ${doc.widthInches ?? '—'} × ${doc.heightInches ?? '—'} po`
        : '';
      const firstImage = Array.isArray(doc.images) ? (doc.images as string[])[0] : undefined;
      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;vertical-align:top;">
            ${firstImage ? `<img src="${firstImage}" alt="" style="width:96px;height:72px;object-fit:cover;border-radius:4px;"/>` : ''}
          </td>
          <td style="padding:8px;border-bottom:1px solid #eee;">
            <div style="font-weight:600;color:#111;">${doc.name ?? ''}</div>
            ${doc.shortDescription ? `<div style=\"color:#666;font-size:12px\">${doc.shortDescription}</div>` : ''}
            ${dims ? `<div style=\"color:#444;font-size:12px;margin-top:2px\">${dims}</div>` : ''}
          </td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">x ${q}</td>
        </tr>
      `;
    }).join('');

    // Taxes TPS/TVQ pour Québec (TPS 5%, TVQ 9.975%)
    const TPS_RATE = 0.05;
    const TVQ_RATE = 0.09975;
    // Si on n'a pas de prix sur les produits, on affiche juste les quantités sans totaux
    const priced = docs.every((d) => typeof (d as Record<string, unknown>).regularPrice === 'number' || typeof (d as Record<string, unknown>).salePrice === 'number');
    let subtotal = 0;
    if (priced) {
      for (const d of docs) {
        const id = String(d._id);
        const q = qtyMap.get(id) ?? 1;
        const doc = d as Record<string, unknown>;
        const price = typeof doc.salePrice === 'number' ? doc.salePrice as number : (typeof doc.regularPrice === 'number' ? doc.regularPrice as number : 0);
        subtotal += price * q;
      }
    }
    const tps = priced ? subtotal * TPS_RATE : 0;
    const tvq = priced ? subtotal * TVQ_RATE : 0;
    const total = priced ? subtotal + tps + tvq : 0;

    const totalsHtml = priced ? `
      <div style="margin-top:12px;padding-top:8px;border-top:1px solid #eee;max-width:320px;margin-left:auto">
        <div style="display:flex;justify-content:space-between"><span>Sous-total</span><strong>${subtotal.toFixed(2)} $</strong></div>
        <div style="display:flex;justify-content:space-between;color:#555"><span>TPS (5%)</span><span>${tps.toFixed(2)} $</span></div>
        <div style="display:flex;justify-content:space-between;color:#555"><span>TVQ (9,975%)</span><span>${tvq.toFixed(2)} $</span></div>
        <div style="display:flex;justify-content:space-between;margin-top:6px"><span>Total</span><strong>${total.toFixed(2)} $</strong></div>
      </div>
    ` : '';

    const deliveryBlock = body.deliveryMethod === 'delivery'
      ? `<p style="margin:8px 0 0 0;color:#333"><strong>Livraison:</strong> ${body.address?.line1 || ''}${body.address?.line2 ? `, ${body.address?.line2}` : ''}, ${body.address?.city || ''}, ${body.address?.province || ''} ${body.address?.postalCode || ''}</p>`
      : `<p style="margin:8px 0 0 0;color:#333"><strong>Ramassage:</strong> 940 Jean‑Neveu, Longueuil (Québec) J4G 2M1</p>`;

    const html = `
      <div style="font:14px/1.4 -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif; color:#111">
        <h2 style="margin:0 0 8px 0">Nouvelle liste de sélection</h2>
        <p style="margin:0 0 12px 0; color:#333">Soumise par: <strong>${body.name}</strong> (${body.email})${body.phone ? ` · ${body.phone}` : ''}${body.company ? ` · ${body.company}` : ''}</p>
        ${body.message ? `<p style=\"margin:0 0 12px 0;color:#333\">Message: ${body.message}</p>` : ''}
        ${deliveryBlock}
        <table style="width:100%;border-collapse:collapse;margin-top:12px">${rows}</table>
        ${totalsHtml}
      </div>
    `;

    const payloadToAdmin = {
      sender: { email: senderEmail, name: senderName },
      replyTo: { email: body.email, name: body.name },
      to: [{ email: adminEmail }],
      subject: `Demande de devis - ${body.name}`,
      htmlContent: html,
    };

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payloadToAdmin),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Brevo error: ${err}` }, { status: 502 });
    }

    // Persist quote request for admin review
    const quotes = db.collection<Document>('quotes');
    const quoteDoc: Document = {
      createdAt: new Date(),
      status: 'received',
      customer: { name: body.name, email: body.email, phone: body.phone, company: body.company },
      delivery: { method: body.deliveryMethod || 'pickup', address: body.address || null },
      message: body.message || '',
      items: docs.map((d) => ({ id: String(d._id), name: (d as Record<string, unknown>).name, quantity: qtyMap.get(String(d._id)) ?? 1 })),
      priced: Boolean(priced),
      totals: priced ? { subtotal, tps, tvq, total } : null,
    };
    const quoteInsert = await quotes.insertOne(quoteDoc);

    // Send confirmation to client
    const clientHtml = `
      <div style="font:14px/1.4 -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif; color:#111">
        <h2 style="margin:0 0 8px 0">Votre demande de soumission</h2>
        <p style="margin:0 0 12px 0; color:#333">Bonjour ${body.name}, nous avons bien reçu votre demande. Voici le récapitulatif :</p>
        <table style="width:100%;border-collapse:collapse;margin-top:12px">${rows}</table>
        ${totalsHtml}
        <p style="margin-top:12px;color:#555">Notre équipe vous répondra rapidement. Merci!</p>
      </div>`;
    const payloadToClient = {
      sender: { email: senderEmail, name: senderName },
      to: [{ email: body.email, name: body.name }],
      subject: `Votre demande de soumission - Spectre`,
      htmlContent: clientHtml,
    };
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify(payloadToClient),
    });

    return NextResponse.json({ ok: true, priced, quoteId: String(quoteInsert.insertedId) });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}


