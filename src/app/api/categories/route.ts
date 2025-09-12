import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import clientPromise from '@/lib/mongodb';
import type { Document } from 'mongodb';

export const revalidate = 3600;

const getCategoriesCached = unstable_cache(
  async () => {
    const client = await clientPromise;
    const db = client.db();
    const categories = db.collection<Document>('categories');
    const docs = await categories
      .find({}, { projection: { name: 1, slug: 1, fullPath: 1, depth: 1, parentId: 1 } })
      .sort({ fullPath: 1 })
      .toArray();
    const items = docs.map((d: any) => ({
    }
    )
    )
    const items = docs.map((d: Document) => ({
      _id: String(d._id),
      name: d.name as string,
      slug: d.slug as string,
      fullPath: d.fullPath as string,
      depth: (d.depth as number) ?? 0,
      parentId: d.parentId ? String(d.parentId) : null,
      label: `${'\u2014 '.repeat(((d.depth as number) ?? 0))}${d.name as string}`,
    }));
    return { items };
  },
  ['api-categories'],
  { revalidate: 3600, tags: ['categories'] }
);

export async function GET() {
  try {
    const data = await getCategoriesCached();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
