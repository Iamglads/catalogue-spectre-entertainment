import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId, type Document } from 'mongodb';
import { getServerSession } from 'next-auth/next';
// Cast to any to accommodate NextAuth v4 types in getServerSession for Next 15
import { authOptions } from '@/lib/auth';
import { finalQuoteEmail, renderItemsTableWithPrices } from '@/lib/emailTemplates';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await (getServerSession as unknown as (opts: any) => Promise<any>)(authOptions);
  const user = session?.user as { role?: 'admin' | 'user' } | undefined;
  if (!user || user.role !== 'admin') {
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
  const q = await quotes.findOne({ _id: new ObjectId(id) });
  if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const toNumber = (v: unknown): number | undefined => {
    if (v === null || v === undefined) return undefined;
    if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
    let s = String(v).trim();
    if (s === '') return undefined;
    s = s.replace(/[\u00A0\s]/g, '');
    s = s.replace(/[^0-9.,-]/g, '');
    if (s === '' || s === '-') return undefined;
    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    let decimalSep: '.' | ',' | null = null;
    if (lastDot >= 0 || lastComma >= 0) {
      if (lastDot >= 0 && lastComma >= 0) decimalSep = lastComma > lastDot ? ',' : '.';
      else decimalSep = lastComma >= 0 ? ',' : '.';
    }
    let cleaned = s;
    if (decimalSep) {
      const otherSep = decimalSep === ',' ? '.' : ',';
      cleaned = cleaned.split(otherSep).join('');
      cleaned = cleaned.replace(decimalSep, '.');
    }
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : undefined;
  };
  const toQty = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
  };
  const itemsRaw = (q.items as Array<{ id?: string; name: string; quantity?: number | string; unitPrice?: number | string; image?: string }>).map((it, idx) => ({
    idx,
    id: it.id,
    name: it.name,
    rawUnitPrice: it.unitPrice,
    quantity: toQty(it.quantity),
    unitPrice: toNumber(it.unitPrice),
    image: it.image,
  }));
  if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
    return NextResponse.json({ error: 'No items to send' }, { status: 400 });
  }
  const invalidItems = itemsRaw.filter((it) => !Number.isFinite(Number(it.unitPrice)));
  if (invalidItems.length) {
    return NextResponse.json({
      error: 'All items must have a unitPrice before sending',
      invalidItems: invalidItems.map((it) => ({
        index: it.idx,
        id: it.id,
        name: it.name,
        unitPriceRaw: it.rawUnitPrice,
        unitPriceParsed: it.unitPrice,
      })),
      hint: 'Assurez-vous que chaque prix est un nombre (utilisez un point pour les décimales, ex: 12.5).',
    }, { status: 400 });
  }
  const itemsTableHtml = renderItemsTableWithPrices(itemsRaw.map(({ name, quantity, unitPrice, image }) => ({ name, quantity, unitPrice, image })));
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

  const customer = q.customer as Partial<{ name: string; email: string }> | undefined;
  const html = finalQuoteEmail({ toName: customer?.name || 'client', intro, itemsTableHtml, totalsHtml, footerNote });
  const toEmail = customer?.email;
  if (!toEmail) return NextResponse.json({ error: 'Missing client email' }, { status: 400 });

  const payload = {
    sender: { email: senderEmail, name: senderName },
    to: [{ email: toEmail, name: customer?.name }],
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
  await quotes.updateOne({ _id: new ObjectId(id) }, { $set: { status: 'sent', sentAt: new Date(), totals: { subtotal, tps, tvq, total } } });
  return NextResponse.json({ ok: true });
}


