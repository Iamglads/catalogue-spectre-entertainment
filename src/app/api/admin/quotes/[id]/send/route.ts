import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId, type Document } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { finalQuoteEmail, renderItemsTableWithPrices } from '@/lib/emailTemplates';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { subject, intro, footerNote } = (await req.json()) as { subject?: string; intro?: string; footerNote?: string };
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'info@spectre-entertainment.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'Catalogue';
  if (!apiKey) return NextResponse.json({ error: 'Brevo not configured' }, { status: 500 });

  const client = await clientPromise;
  const db = client.db();
  const quotes = db.collection<Document>('quotes');
  const q = await quotes.findOne({ _id: new ObjectId(params.id) });
  if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const itemsRaw = (q.items as any[]).map((it) => ({ name: it.name, quantity: it.quantity || 1, unitPrice: it.unitPrice, image: it.image }));
  if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
    return NextResponse.json({ error: 'No items to send' }, { status: 400 });
  }
  const hasMissing = itemsRaw.some((it) => typeof it.unitPrice !== 'number' || !Number.isFinite(it.unitPrice));
  if (hasMissing) {
    return NextResponse.json({ error: 'All items must have a unitPrice before sending' }, { status: 400 });
  }
  const itemsTableHtml = renderItemsTableWithPrices(itemsRaw as any);
  const subtotal = itemsRaw.reduce((acc, it) => acc + ((Number(it.unitPrice) || 0) * (Number(it.quantity) || 1)), 0);
  const tps = subtotal * 0.05;
  const tvq = subtotal * 0.09975;
  const total = subtotal + tps + tvq;
  const totalsHtml = `
    <div style="margin-top:12px;padding-top:8px;border-top:1px solid #eee;max-width:320px;margin-left:auto">
      <div style="display:flex;justify-content:space-between"><span>Sous-total</span><strong>${subtotal.toFixed(2)} $</strong></div>
      <div style="display:flex;justify-content:space-between;color:#555"><span>TPS (5%)</span><span>${tps.toFixed(2)} $</span></div>
      <div style="display:flex;justify-content:space-between;color:#555"><span>TVQ (9,975%)</span><span>${tvq.toFixed(2)} $</span></div>
      <div style="display:flex;justify-content:space-between;margin-top:6px"><span>Total</span><strong>${total.toFixed(2)} $</strong></div>
    </div>`;

  const html = finalQuoteEmail({ toName: (q.customer as any)?.name || 'client', intro, itemsTableHtml, totalsHtml, footerNote });
  const toEmail = (q.customer as any)?.email;
  if (!toEmail) return NextResponse.json({ error: 'Missing client email' }, { status: 400 });

  const payload = {
    sender: { email: senderEmail, name: senderName },
    to: [{ email: toEmail, name: (q.customer as any)?.name }],
    subject: subject || 'Votre soumission',
    htmlContent: html,
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Brevo error: ${err}` }, { status: 502 });
  }
  await quotes.updateOne({ _id: new ObjectId(params.id) }, { $set: { status: 'sent', sentAt: new Date(), totals: { subtotal, tps, tvq, total } } });
  return NextResponse.json({ ok: true });
}


