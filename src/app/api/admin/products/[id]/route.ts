import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId, type Document } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const client = await clientPromise;
  const db = client.db();
  const products = db.collection<Document>('products');
  const doc = await products.findOne({ _id: new ObjectId(params.id) });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...doc, _id: String(doc._id) });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = (await req.json()) as Document;
  const client = await clientPromise;
  const db = client.db();
  const products = db.collection<Document>('products');
  const categoriesCol = db.collection<Document>('categories');
  const inputCategoryIds: string[] = Array.isArray((body as any).categoryIds) ? (body as any).categoryIds : [];
  const categoryIds: ObjectId[] = [];
  for (const id of inputCategoryIds) { try { categoryIds.push(new ObjectId(id)); } catch {} }
  const allCategoryIds: ObjectId[] = [];
  const seen = new Set<string>();
  async function addWithAncestors(catId: ObjectId) {
    const idStr = String(catId);
    if (seen.has(idStr)) return;
    seen.add(idStr);
    allCategoryIds.push(catId);
    const cat = await categoriesCol.findOne({ _id: catId }, { projection: { parentId: 1 } });
    if (cat?.parentId) await addWithAncestors(cat.parentId as ObjectId);
  }
  for (const cid of categoryIds) await addWithAncestors(cid);
  const updateDoc: Document = { ...body, categoryIds, allCategoryIds, updatedAt: new Date() };
  await products.updateOne({ _id: new ObjectId(params.id) }, { $set: updateDoc });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const client = await clientPromise;
  const db = client.db();
  const products = db.collection<Document>('products');
  await products.deleteOne({ _id: new ObjectId(params.id) });
  return NextResponse.json({ ok: true });
}


