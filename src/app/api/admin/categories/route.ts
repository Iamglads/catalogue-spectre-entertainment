import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId, type Document } from 'mongodb';
import { getSession } from '@/lib/auth';
import { slugify } from '@/lib/slug';

// List + create
export async function GET(req: NextRequest) {
  const session = await getSession();
  const user = session?.user as { role?: 'admin' | 'user' } | undefined;
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const client = await clientPromise;
  const db = client.db();
  const categories = db.collection<Document>('categories');
  const items = await categories.find({}, { projection: { name: 1, slug: 1, fullPath: 1, depth: 1, parentId: 1 } }).sort({ fullPath: 1 }).toArray();
  return NextResponse.json({ items: items.map((d) => ({ ...d, _id: String(d._id), parentId: d.parentId ? String(d.parentId) : null })) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const user = session?.user as { role?: 'admin' | 'user' } | undefined;
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { name, parentId } = (await req.json()) as { name?: string; parentId?: string | null };
  if (!name || !name.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const client = await clientPromise;
  const db = client.db();
  const categories = db.collection<Document>('categories');
  const parent = parentId ? await categories.findOne({ _id: new ObjectId(parentId) }) : null;
  const slug = slugify(name);
  const fullPath = parent ? `${parent.fullPath}/${slug}` : slug;
  const depth = parent ? ((parent.depth as number) ?? 0) + 1 : 0;
  const res = await categories.insertOne({ name, slug, fullPath, depth, parentId: parent?._id ?? null, createdAt: new Date(), updatedAt: new Date() });
  return NextResponse.json({ _id: String(res.insertedId) });
}


