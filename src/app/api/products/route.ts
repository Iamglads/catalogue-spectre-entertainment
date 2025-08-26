import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import clientPromise from '@/lib/mongodb';
import { ObjectId, type Document } from 'mongodb';

const PAGE_SIZE = 20;

function parseNumberParam(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseBooleanParam(value: string | null): boolean | undefined {
  if (!value) return undefined;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return undefined;
}

export const revalidate = 300;

export async function GET(req: NextRequest) {
  try {
    // Basic diagnostics in production (no secrets)
    if (process.env.NODE_ENV === 'production') {
      // eslint-disable-next-line no-console
      console.log('[api/products] request', { url: req.url, hasMongoUri: Boolean(process.env.MONGODB_URI), mongoSrv: (process.env.MONGODB_URI || '').startsWith('mongodb+srv://') });
    }
    const client = await clientPromise;
    const db = client.db();
    const products = db.collection<Document>('products');
    const categories = db.collection<Document>('categories');

    const { searchParams } = new URL(req.url);

    const q = searchParams.get('q');
    const categoryIdParam = searchParams.get('categoryId');
    const categoryPath = searchParams.get('categoryPath'); // fullPath de slugs: ex: thematique/tour-du-monde
    const minPrice = parseNumberParam(searchParams.get('minPrice'));
    const maxPrice = parseNumberParam(searchParams.get('maxPrice'));
    const inStock = parseBooleanParam(searchParams.get('inStock'));
    const brand = searchParams.get('brand');

    const pageParam = parseNumberParam(searchParams.get('page'));
    const page = pageParam && pageParam > 0 ? pageParam : 1;

    const filter: Document = {};
    const and: Document[] = [];

    // Exclure brouillons et éléments non visibles
    and.push({ visibility: 'visible' });
    and.push({ $or: [ { 'raw.Publié': 1 }, { 'raw.Publié': '1' } ] });

    if (q && q.trim()) {
      and.push({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { shortDescription: { $regex: q, $options: 'i' } },
        ],
      });
    }

    if (typeof inStock === 'boolean') {
      and.push({ isInStock: inStock });
    }

    if (brand && brand.trim()) {
      and.push({ brand: { $regex: `^${brand.trim()}$`, $options: 'i' } });
    }

    if (categoryIdParam) {
      try {
        const catId = new ObjectId(categoryIdParam);
        and.push({ allCategoryIds: catId });
      } catch {}
    }

    if (categoryPath && categoryPath.trim()) {
      const cat = await categories.findOne({ fullPath: categoryPath.trim() }, { projection: { _id: 1 } });
      if (cat?._id) {
        and.push({ allCategoryIds: cat._id });
      }
    }

    const priceExprParts: Document[] = [];
    if (typeof minPrice === 'number') {
      priceExprParts.push({ $gte: [ { $ifNull: ['$salePrice', '$regularPrice'] }, minPrice ] });
    }
    if (typeof maxPrice === 'number') {
      priceExprParts.push({ $lte: [ { $ifNull: ['$salePrice', '$regularPrice'] }, maxPrice ] });
    }
    if (priceExprParts.length === 1) {
      and.push({ $expr: priceExprParts[0] });
    } else if (priceExprParts.length > 1) {
      and.push({ $expr: { $and: priceExprParts } });
    }

    if (and.length) filter.$and = and;

    const skip = (page - 1) * PAGE_SIZE;

    const cacheKey = ['api-products', JSON.stringify({ filter, page })];
    const fetchPage = unstable_cache(
      async () => {
        const [total, items] = await Promise.all([
          products.countDocuments(filter),
          products
            .find(filter)
            .sort({ createdAt: -1, _id: 1 })
            .skip(skip)
            .limit(PAGE_SIZE)
            .toArray(),
        ]);
        return { total, items };
      },
      cacheKey,
      { revalidate: 300, tags: ['products'] }
    );

    const { total, items } = await fetchPage();
    const itemsOut = items.map((d: Document) => ({ ...d, _id: String(d._id) }));

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return NextResponse.json({
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages,
      items: itemsOut,
    }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[api/products] error', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
