import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId, type Document } from 'mongodb';
import { quoteRequestEmail, renderItemsTableWithPrices } from '@/lib/emailTemplates';

type SendListBody = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  eventDate?: string;
  items: Array<{ id: string; quantity: number }>;
  postalCode?: string;
  deliveryMethod?: 'pickup' | 'delivery';
  address?: { line1: string; line2?: string; city: string; province: string; postalCode: string };
};

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'info@spectre-entertainment.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'Catalogue décors';
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
      { projection: { name: 1, images: 1, shortDescription: 1, lengthInches: 1, widthInches: 1, heightInches: 1, regularPrice: 1, salePrice: 1, inventory: 1, stockQty: 1 } }
    ).toArray();

    const qtyMap = new Map(body.items.map((i) => [i.id, Math.max(1, Number(i.quantity) || 1)]));

    // Validate requested quantities against available inventory
    const violations: Array<{ id: string; name: string; requested: number; available: number }> = [];
    for (const d of docs) {
      const id = String(d._id);
      const requested = qtyMap.get(id) ?? 1;
      const anyDoc = d as any;
      const available: number | undefined = typeof anyDoc.inventory === 'number'
        ? anyDoc.inventory
        : (typeof anyDoc.stockQty === 'number' ? anyDoc.stockQty : undefined);
      if (typeof available === 'number' && requested > available) {
        violations.push({ id, name: (d as any).name || id, requested, available });
      }
    }
    if (violations.length > 0) {
      const msg = 'Certains articles dépassent notre inventaire: ' + violations.map(v => `${v.name}: demandé ${v.requested}, disponible ${v.available}`).join('; ') + '. Veuillez ajuster les quantités.';
      return new NextResponse(msg, { status: 400 });
    }

    const rows = docs.map((d: Document & { images?: string[]; name?: string; shortDescription?: string; lengthInches?: number; widthInches?: number; heightInches?: number }) => {
      const id = String(d._id);
      const q = qtyMap.get(id) ?? 1;
      const dims = [d.lengthInches, d.widthInches, d.heightInches].some(Boolean)
        ? `Dim.: ${d.lengthInches ?? '—'} × ${d.widthInches ?? '—'} × ${d.heightInches ?? '—'} po`
        : '';
      const firstImage = Array.isArray(d.images) ? d.images?.[0] : undefined;
      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;vertical-align:top;">
            ${firstImage ? `<img src="${firstImage}" alt="" style="width:96px;height:72px;object-fit:cover;border-radius:4px;"/>` : ''}
          </td>
          <td style="padding:8px;border-bottom:1px solid #eee;">
            <div style="font-weight:600;color:#111;">${d.name ?? ''}</div>
            ${d.shortDescription ? `<div style=\"color:#666;font-size:12px\">${d.shortDescription}</div>` : ''}
            ${dims ? `<div style=\"color:#444;font-size:12px;margin-top:2px\">${dims}</div>` : ''}
          </td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">x ${q}</td>
        </tr>
      `;
    }).join('');

    // Taxes TPS/TVQ pour Québec (TPS 5%, TVQ 9.975%)
    const TPS_RATE = 0.05;
    const TVQ_RATE = 0.09975;
    // Construire un tableau d'items avec prix pour l'admin (préférence salePrice sinon regularPrice)
    const itemsWithPrices = docs.map((d: Document & { images?: string[]; name?: string; regularPrice?: number; salePrice?: number }) => {
      const id = String(d._id);
      const q = qtyMap.get(id) ?? 1;
      const firstImage = Array.isArray(d.images) ? d.images?.[0] : undefined;
      const price = typeof d.salePrice === 'number' ? d.salePrice : (typeof d.regularPrice === 'number' ? d.regularPrice : undefined);
      return { name: d.name ?? '', quantity: q, unitPrice: price, image: firstImage };
    });
    const subtotal = itemsWithPrices.reduce((acc, it) => acc + ((Number(it.unitPrice) || 0) * (Number(it.quantity) || 1)), 0);
    const tps = subtotal > 0 ? subtotal * TPS_RATE : 0;
    const tvq = subtotal > 0 ? subtotal * TVQ_RATE : 0;
    const total = subtotal > 0 ? subtotal + tps + tvq : 0;
    const priced = subtotal > 0;
    const adminItemsTableHtml = renderItemsTableWithPrices(itemsWithPrices);
    const adminTotalsHtml = subtotal > 0 ? `
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

    // Format event date for display
    const eventDateBlock = body.eventDate 
      ? `<p style="margin:8px 0 0 0;color:#333"><strong>Date de l'événement:</strong> ${new Date(body.eventDate).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>`
      : '';

    const html = quoteRequestEmail({
      name: body.name,
      email: body.email,
      phone: body.phone,
      company: body.company,
      message: body.message,
      eventDate: body.eventDate,
      deliveryBlock,
      eventDateBlock,
      itemsTableHtml: adminItemsTableHtml,
      totalsHtml: adminTotalsHtml,
    });

    const payloadToAdmin = {
      sender: { email: senderEmail, name: senderName },
      replyTo: { email: body.email, name: body.name },
      to: [{ email: adminEmail }, { email: "stephane@spectre-entertainment.com" }],
      subject: `🔔 Demande de soumission catalogue décors - ${body.name}`,
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
      eventDate: body.eventDate || null,
      items: docs.map((d: Document & { name?: string; regularPrice?: number; salePrice?: number; images?: string[] }) => {
        const id = String(d._id);
        const unitPrice = typeof d.salePrice === 'number' ? d.salePrice : (typeof d.regularPrice === 'number' ? d.regularPrice : undefined);
        const image = Array.isArray(d.images) ? d.images[0] : undefined;
        return { 
          id, 
          name: d.name ?? '', 
          quantity: qtyMap.get(id) ?? 1,
          unitPrice,
          image
        };
      }),
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


