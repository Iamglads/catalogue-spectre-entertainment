import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId, type Document } from 'mongodb';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  const user = session?.user as { role?: 'admin' | 'user' } | undefined;
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const pageParam = Number(searchParams.get('page') || '1');
  const pageSizeParam = Number(searchParams.get('pageSize') || '20');
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize = Number.isFinite(pageSizeParam) && pageSizeParam > 0 && pageSizeParam <= 100 ? pageSizeParam : 20;
  const skip = (page - 1) * pageSize;

  const client = await clientPromise;
  const db = client.db();
  const quotes = db.collection<Document>('quotes');
  const [total, rows] = await Promise.all([
    quotes.countDocuments({}),
    quotes.find({}).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(pageSize).project({ message: 0 }).toArray(),
  ]);
  return NextResponse.json({ total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)), items: rows.map((d) => ({ ...d, _id: String(d._id) })) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const user = session?.user as { role?: 'admin' | 'user' } | undefined;
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = (await req.json()) as Document;
  const client = await clientPromise;
  const db = client.db();
  const quotes = db.collection<Document>('quotes');
  const res = await quotes.insertOne({ ...body, createdAt: new Date(), updatedAt: new Date() });
  return NextResponse.json({ _id: String(res.insertedId) });
}


