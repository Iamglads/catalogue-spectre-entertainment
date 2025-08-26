import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId, type Document } from 'mongodb';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get('ids') || '';
    const ids = idsParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!ids.length) {
      return NextResponse.json({ items: [] });
    }

    const objectIds: ObjectId[] = [];
    for (const id of ids) {
      try {
        objectIds.push(new ObjectId(id));
      } catch {}
    }

    if (!objectIds.length) {
      return NextResponse.json({ items: [] });
    }

    const client = await clientPromise;
    const db = client.db();
    const products = db.collection<Document>('products');

    const docs = await products
      .find(
        { _id: { $in: objectIds } },
        { projection: { name: 1, images: 1, shortDescription: 1, isInStock: 1 } }
      )
      .toArray();

    const items = docs.map((d) => ({
      _id: String(d._id),
      name: d.name as string,
      shortDescription: (d as any).shortDescription as string | undefined,
      images: (d as any).images as string[] | undefined,
      isInStock: (d as any).isInStock as boolean | undefined,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}


