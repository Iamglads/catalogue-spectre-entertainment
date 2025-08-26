import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId, type Document } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// List + create
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions as any);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const client = await clientPromise;
  const db = client.db();
  const products = db.collection<Document>('products');
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const status = searchParams.get('status');
  const pageParam = Number(searchParams.get('page') || '1');
  const pageSizeParam = Number(searchParams.get('pageSize') || '20');
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize = Number.isFinite(pageSizeParam) && pageSizeParam > 0 && pageSizeParam <= 100 ? pageSizeParam : 20;
  const filter: Document = {};
  const and: Document[] = [];
  if (q) and.push({ name: { $regex: q, $options: 'i' } });
  if (status === 'published') {
    and.push({ $or: [ { 'raw.Publié': 1 }, { 'raw.Publié': '1' } ] });
  } else if (status === 'draft') {
    and.push({ $nor: [ { 'raw.Publié': 1 }, { 'raw.Publié': '1' } ] });
  }
  if (and.length) filter.$and = and;
  const skip = (page - 1) * pageSize;
  const [total, rows] = await Promise.all([
    products.countDocuments(filter),
    products.find(filter).sort({ _id: -1 }).skip(skip).limit(pageSize).toArray(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return NextResponse.json({
    total,
    page,
    pageSize,
    totalPages,
    items: rows.map((d) => ({ ...d, _id: String(d._id) })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = (await req.json()) as Document;
  const client = await clientPromise;
  const db = client.db();
  const products = db.collection<Document>('products');
  // handle categories
  const categoriesCol = db.collection<Document>('categories');
  const inputCategoryIds: string[] = Array.isArray((body as any).categoryIds) ? (body as any).categoryIds : [];
  const categoryIds: ObjectId[] = [];
  for (const id of inputCategoryIds) {
    try { categoryIds.push(new ObjectId(id)); } catch {}
  }
  const allCategoryIds: ObjectId[] = [];
  const seen = new Set<string>();
  async function addWithAncestors(catId: ObjectId) {
    const idStr = String(catId);
    if (seen.has(idStr)) return;
    seen.add(idStr);
    allCategoryIds.push(catId);
    const cat = await categoriesCol.findOne({ _id: catId }, { projection: { parentId: 1 } });
    if (cat?.parentId) {
      await addWithAncestors(cat.parentId as ObjectId);
    }
  }
  for (const cid of categoryIds) {
    await addWithAncestors(cid);
  }
  const doc: Document = { ...body, categoryIds, allCategoryIds, createdAt: new Date(), updatedAt: new Date() };
  const res = await products.insertOne(doc);
  return NextResponse.json({ _id: String(res.insertedId) });
}


