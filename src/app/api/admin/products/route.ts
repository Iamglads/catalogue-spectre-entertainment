import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import clientPromise from '@/lib/mongodb';
import { ObjectId, type Document } from 'mongodb';
import { getServerSession } from 'next-auth/next';
// Cast to any to accommodate NextAuth v4 types in getServerSession for Next 15
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { isCloudinaryEnabled, uploadImageFromUrlOrData } from '@/lib/cloudinary';

// List + create
export async function GET(req: NextRequest) {
  const session = await (getServerSession as unknown as (opts: any) => Promise<any>)(authOptions);
  const user = session?.user as { role?: 'admin' | 'user' } | undefined;
  if (!user || (user.role !== 'admin' && user.role !== 'user')) {
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
    products
      .find(filter)
      .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray(),
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
  const session = await (getServerSession as unknown as (opts: any) => Promise<any>)(authOptions);
  const user = session?.user as { role?: 'admin' | 'user' } | undefined;
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = (await req.json()) as Document;
  const client = await clientPromise;
  const db = client.db();
  const products = db.collection<Document>('products');
  // handle categories
  const categoriesCol = db.collection<Document>('categories');
  const rawCategoryIds = (body as { categoryIds?: unknown }).categoryIds;
  const inputCategoryIds: string[] = Array.isArray(rawCategoryIds)
    ? (rawCategoryIds as unknown[]).filter((x): x is string => typeof x === 'string')
    : [];
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

  // Cloudinary images handling
  let images: string[] = Array.isArray((body as { images?: unknown }).images)
    ? ((body as { images?: unknown[] }).images || []).filter((u): u is string => typeof u === 'string')
    : [];
  const imagePublicIdsSet = new Set<string>(Array.isArray((body as { imagePublicIds?: unknown }).imagePublicIds)
    ? ((body as { imagePublicIds?: unknown[] }).imagePublicIds || []).filter((p): p is string => typeof p === 'string')
    : []);
  if (isCloudinaryEnabled()) {
    const uploaded: Array<{ url: string; publicId: string } | string> = [];
    for (const u of images) {
      if (/res\.cloudinary\.com|^https?:\/\/.*\/image\/upload\//.test(u)) {
        uploaded.push(u);
        continue;
      }
      const res = await uploadImageFromUrlOrData(u).catch(() => null);
      if (res) {
        uploaded.push(res);
      } else {
        uploaded.push(u);
      }
    }
    images = uploaded.map((v) => (typeof v === 'string' ? v : v.url));
    for (const v of uploaded) { if (typeof v !== 'string') imagePublicIdsSet.add(v.publicId); }
  }

  const doc: Document = { ...body, images, imagePublicIds: Array.from(imagePublicIdsSet), categoryIds, allCategoryIds, createdAt: new Date(), updatedAt: new Date() };
  const res = await products.insertOne(doc);
  const auditUser = session?.user as { id?: string; email?: string } | undefined;
  await logAudit({ userId: auditUser?.id, email: auditUser?.email || null, action: 'product.create', resource: { type: 'product', id: String(res.insertedId) }, metadata: { name: body?.name } });
  try { revalidateTag('products'); } catch {}
  return NextResponse.json({ _id: String(res.insertedId) });
}


