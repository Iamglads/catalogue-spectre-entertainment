import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId, type Document } from 'mongodb';
import { getServerSession } from 'next-auth/next';
// Cast to any to accommodate NextAuth v4 types in getServerSession for Next 15
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { isCloudinaryEnabled, uploadImageFromUrlOrData } from '@/lib/cloudinary';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await (getServerSession as unknown as (opts: any) => Promise<any>)(authOptions);
  const user = session?.user as { role?: 'admin' | 'user' } | undefined;
  if (!user || (user.role !== 'admin' && user.role !== 'user')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const client = await clientPromise;
  const db = client.db();
  const products = db.collection<Document>('products');
  const doc = await products.findOne({ _id: new ObjectId(id) });
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
  const client = await clientPromise;
  const db = client.db();
  const products = db.collection<Document>('products');
  const categoriesCol = db.collection<Document>('categories');
  const rawCategoryIds = (body as { categoryIds?: unknown }).categoryIds;
  const inputCategoryIds: string[] = Array.isArray(rawCategoryIds)
    ? (rawCategoryIds as unknown[]).filter((x): x is string => typeof x === 'string')
    : [];
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
      uploaded.push(res ?? u);
    }
    images = uploaded.map((v) => (typeof v === 'string' ? v : v.url));
    for (const v of uploaded) { if (typeof v !== 'string') imagePublicIdsSet.add(v.publicId); }
  }

  const updateDoc: Document = { ...body, images, imagePublicIds: Array.from(imagePublicIdsSet), categoryIds, allCategoryIds, updatedAt: new Date() };
  await products.updateOne({ _id: new ObjectId(id) }, { $set: updateDoc });
  const auditUser = session?.user as { id?: string; email?: string } | undefined;
  await logAudit({ userId: auditUser?.id, email: auditUser?.email || null, action: 'product.update', resource: { type: 'product', id }, metadata: { fields: Object.keys(body || {}) } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await (getServerSession as unknown as (opts: any) => Promise<any>)(authOptions);
  const user = session?.user as { role?: 'admin' | 'user' } | undefined;
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const client = await clientPromise;
  const db = client.db();
  const products = db.collection<Document>('products');
  await products.deleteOne({ _id: new ObjectId(id) });
  const auditUser2 = session?.user as { id?: string; email?: string } | undefined;
  await logAudit({ userId: auditUser2?.id, email: auditUser2?.email || null, action: 'product.delete', resource: { type: 'product', id } });
  return NextResponse.json({ ok: true });
}


