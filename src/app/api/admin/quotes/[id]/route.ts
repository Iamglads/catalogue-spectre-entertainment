import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId, type Document } from 'mongodb';
import { getServerSession } from 'next-auth/next';
// Cast to any to accommodate NextAuth v4 types in getServerSession for Next 15
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await (getServerSession as unknown as (opts: any) => Promise<any>)(authOptions);
  const user = session?.user as { role?: 'admin' | 'user' } | undefined;
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const client = await clientPromise;
  const db = client.db();
  const quotes = db.collection<Document>('quotes');
  const doc = await quotes.findOne({ _id: new ObjectId(id) });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...doc, _id: String(doc._id) });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await (getServerSession as unknown as (opts: any) => Promise<any>)(authOptions);
  const user = session?.user as { role?: 'admin' | 'user' } | undefined;
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = (await req.json()) as Document;
  // Sanitize items: coerce numeric fields, ensure min quantity
  if (Array.isArray(body.items)) {
    const parseFlexibleNumber = (v: unknown): number | undefined => {
      if (v === null || v === undefined) return undefined;
      if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
      let s = String(v).trim();
      if (s === '') return undefined;
      s = s.replace(/[\u00A0\s]/g, ''); // remove spaces including nbsp
      s = s.replace(/[^0-9.,-]/g, ''); // keep only digits, separators, minus
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
        cleaned = cleaned.split(otherSep).join(''); // remove thousands
        cleaned = cleaned.replace(decimalSep, '.');
      }
      const num = Number(cleaned);
      return Number.isFinite(num) ? num : undefined;
    };
    const normalizeQty = (v: unknown): number => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
    };
    body.items = (body.items as Array<Document>).map((it: Document) => ({
      ...it,
      quantity: normalizeQty(it.quantity),
      unitPrice: parseFlexibleNumber(it.unitPrice),
    })) as unknown as Document;
  }
  const client = await clientPromise;
  const db = client.db();
  const quotes = db.collection<Document>('quotes');
  await quotes.updateOne({ _id: new ObjectId(id) }, { $set: { ...body, updatedAt: new Date() } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await (getServerSession as unknown as (opts: any) => Promise<any>)(authOptions);
  const user = session?.user as { role?: 'admin' | 'user'; id?: string; email?: string } | undefined;
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const client = await clientPromise;
  const db = client.db();
  const quotes = db.collection<Document>('quotes');
  const _id = new ObjectId(id);
  const res = await quotes.deleteOne({ _id });
  if (res.deletedCount !== 1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  await logAudit({ userId: user.id, email: user.email || null, action: 'quote.delete', resource: { type: 'quote', id }, metadata: {} });
  return NextResponse.json({ ok: true });
}


