import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId, type Document } from 'mongodb';
import { getServerSession } from 'next-auth/next';
// Cast to any to accommodate NextAuth v4 types in getServerSession for Next 15
import { authOptions } from '@/lib/auth';
import { slugify } from '@/lib/slug';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await (getServerSession as unknown as (opts: any) => Promise<any>)(authOptions);
  const user = session?.user as { role?: 'admin' | 'user' } | undefined;
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const client = await clientPromise;
  const db = client.db();
  const categories = db.collection<Document>('categories');
  const doc = await categories.findOne({ _id: new ObjectId(id) });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...doc, _id: String(doc._id), parentId: doc.parentId ? String(doc.parentId) : null });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await (getServerSession as unknown as (opts: any) => Promise<any>)(authOptions);
  const user = session?.user as { role?: 'admin' | 'user' } | undefined;
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { name, parentId } = (await req.json()) as { name?: string; parentId?: string | null };
  const client = await clientPromise;
  const db = client.db();
  const categories = db.collection<Document>('categories');
  const parent = parentId ? await categories.findOne({ _id: new ObjectId(parentId) }) : null;
  const slug = name ? slugify(name) : undefined;
  let fullPath: string | undefined;
  let depth: number | undefined;
  if (slug !== undefined) {
    if (parent) {
      fullPath = `${parent.fullPath}/${slug}`;
      depth = ((parent.depth as number) ?? 0) + 1;
    } else {
      fullPath = slug;
      depth = 0;
    }
  }
  const $set: Document = { updatedAt: new Date() };
  if (name !== undefined) $set.name = name;
  if (slug !== undefined) $set.slug = slug;
  if (fullPath !== undefined) $set.fullPath = fullPath;
  if (depth !== undefined) $set.depth = depth;
  $set.parentId = parent?._id ?? null;
  await categories.updateOne({ _id: new ObjectId(id) }, { $set });
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
  const categories = db.collection<Document>('categories');
  // prevent delete if has children
  const child = await categories.findOne({ parentId: new ObjectId(id) }, { projection: { _id: 1 } });
  if (child) return NextResponse.json({ error: 'Category has children' }, { status: 400 });
  await categories.deleteOne({ _id: new ObjectId(id) });
  // remove references from products
  const products = db.collection<{ categoryIds?: ObjectId[]; allCategoryIds?: ObjectId[] }>('products');
  await products.updateMany({}, { $pull: { categoryIds: new ObjectId(id), allCategoryIds: new ObjectId(id) } });
  return NextResponse.json({ ok: true });
}


