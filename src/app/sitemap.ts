import type { MetadataRoute } from 'next';
import clientPromise from '@/lib/mongodb';
import { ObjectId, type Document } from 'mongodb';
import { slugify } from '@/lib/slug';

const siteUrl = 'https://spectre-entertainment.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Routes statiques avec dates et priorités optimisées
  const staticRoutes: MetadataRoute.Sitemap = [
    { 
      url: `${siteUrl}/`, 
      lastModified: new Date(),
      changeFrequency: 'daily', 
      priority: 1.0 
    },
    { 
      url: `${siteUrl}/decors-a-vendre`, 
      lastModified: new Date(),
      changeFrequency: 'daily', 
      priority: 0.9 
    },
    { 
      url: `${siteUrl}/liste`, 
      lastModified: new Date(),
      changeFrequency: 'monthly', 
      priority: 0.5 
    },
  ];

  try {
    const client = await clientPromise;
    const db = client.db();
    const products = db.collection<Document>('products');
    const categories = db.collection<Document>('categories');

    // Produits visibles et publiés avec dates de mise à jour
    const cursor = products.find(
      { visibility: 'visible', $or: [{ 'raw.Publié': 1 }, { 'raw.Publié': '1' }] },
      { 
        projection: { _id: 1, name: 1, updatedAt: 1 }, 
        sort: { updatedAt: -1 }, 
        limit: 20000 
      }
    );

    const productItems: MetadataRoute.Sitemap = [];
    for await (const doc of cursor) {
      const id = String(doc._id as ObjectId);
      const name = String(doc.name || 'produit');
      const slug = slugify(name);
      productItems.push({
        url: `${siteUrl}/produit/${id}/${slug}`,
        lastModified: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    // Catégories
    const categoryCursor = categories.find(
      {},
      { projection: { _id: 1, name: 1, fullPath: 1 }, sort: { name: 1 } }
    );

    const categoryItems: MetadataRoute.Sitemap = [];
    for await (const doc of categoryCursor) {
      if (doc.fullPath && typeof doc.fullPath === 'string') {
        categoryItems.push({
          url: `${siteUrl}/?categoryId=${String(doc._id)}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }

    return [...staticRoutes, ...productItems, ...categoryItems];
  } catch (error) {
    console.error('Erreur génération sitemap:', error);
    return staticRoutes;
  }
}










