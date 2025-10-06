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
        { projection: { name: 1, images: 1, shortDescription: 1, isInStock: 1, inventory: 1, stockQty: 1 } }
      )
      .toArray();

    const items = docs.map((d) => {
      const anyDoc = d as any;
      const inventory: number | undefined = typeof anyDoc.inventory === 'number'
        ? anyDoc.inventory
        : (typeof anyDoc.stockQty === 'number' ? anyDoc.stockQty : undefined);
      return {
        _id: String(d._id),
        name: (d as Document & { name?: string }).name || '',
        shortDescription: (d as Document & { shortDescription?: string }).shortDescription,
        images: (d as Document & { images?: string[] }).images,
        isInStock: (d as Document & { isInStock?: boolean }).isInStock,
        stockQty: typeof inventory === 'number' ? inventory : undefined,
      } as any;
    });

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}


