import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId, type Document } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const client = await clientPromise;
  const db = client.db();
  const quotes = db.collection<Document>('quotes');
  const doc = await quotes.findOne({ _id: new ObjectId(params.id) });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...doc, _id: String(doc._id) });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = (await req.json()) as Document;
  const client = await clientPromise;
  const db = client.db();
  const quotes = db.collection<Document>('quotes');
  await quotes.updateOne({ _id: new ObjectId(params.id) }, { $set: { ...body, updatedAt: new Date() } });
  return NextResponse.json({ ok: true });
}


