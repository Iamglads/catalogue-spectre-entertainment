import type { MetadataRoute } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId, type Document } from 'mongodb';
import { slugify } from '@/lib/slug';

const siteUrl = 'https://spectre-entertainment.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/decors-a-vendre`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/liste`, changeFrequency: 'weekly', priority: 0.6 },
  ];

  try {
    const client = await clientPromise;
    const db = client.db();
    const products = db.collection<Document>('products');

    // Only visible and published products
    const cursor = products.find(
      { visibility: 'visible', $or: [{ 'raw.Publié': 1 }, { 'raw.Publié': '1' }] },
      { projection: { _id: 1, name: 1 }, sort: { updatedAt: -1 }, limit: 20000 }
    );

    const items: MetadataRoute.Sitemap = [];
    for await (const doc of cursor) {
      const id = String(doc._id as ObjectId);
      const name = String(doc.name || 'produit');
      const slug = slugify(name);
      items.push({
        url: `${siteUrl}/produit/${id}/${slug}`,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }

    return [...staticRoutes, ...items];
  } catch {
    return staticRoutes;
  }
}
