import 'dotenv/config';
import { MongoClient, type Document, ObjectId } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';
import pLimit from 'p-limit';
import crypto from 'crypto';

/**
 * Migration depuis le sous-site WordPress vers Cloudinary
 * - Scanne les produits et toute URL d'image pointant vers le sous-site WP
 * - Upload direct depuis l'URL (upload_from_url) → Cloudinary
 * - Met à jour les documents produits avec les secure_url Cloudinary
 *
 * Variables d'env requises:
 * - MONGODB_URI
 * - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 * - (optionnel) CLOUDINARY_FOLDER (ex: spectre/products)
 */

const WORDPRESS_BASE = 'https://spectre-entertainment.com';
const WORDPRESS_CATALOG_PREFIX = `${WORDPRESS_BASE}/catalogue-decors/`;
const WP_HOST_REGEX = /^https?:\/\/(?:www\.)?spectre-entertainment\.com/i;
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'spectre/products';
const CONCURRENCY = Number(process.env.MIGRATION_CONCURRENCY || 4);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

function isWpImage(url?: unknown): url is string {
  return typeof url === 'string' && WP_HOST_REGEX.test(url);
}

function toPublicId(entityId: string, url: string): string {
  const ext = (url.split('.').pop() || 'jpg').split('?')[0].toLowerCase();
  const hash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 10);
  return `${CLOUDINARY_FOLDER}/${entityId}-${hash}.${ext}`;
}

async function uploadFromUrl(entityId: string, url: string): Promise<string> {
  const public_id = toPublicId(entityId, url);
  const res = await cloudinary.uploader.upload(url, {
    public_id,
    overwrite: false,
    unique_filename: false,
    resource_type: 'image',
  });
  return res.secure_url;
}

async function getExistingSecureUrl(entityId: string, url: string): Promise<string | null> {
  const public_id = toPublicId(entityId, url);
  try {
    // @ts-ignore api types are loose in v2
    const res = await cloudinary.api.resource(public_id, { resource_type: 'image' });
    if (res && typeof res.secure_url === 'string' && res.secure_url) return String(res.secure_url);
    return null;
  } catch (e: any) {
    // If not found, Cloudinary returns 404 error
    return null;
  }
}

async function migrateProductsImages(dbName = undefined) {
  const mongoUri = process.env.MONGODB_URI!;
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(dbName);
  const products = db.collection<Document>('products');

  const limit = pLimit(CONCURRENCY);
  const BATCH_SIZE = Number(process.env.MIGRATION_BATCH_SIZE || 50);
  let updated = 0;
  let lastId: ObjectId | null = null;

  // Filtre: documents qui contiennent au moins une image hébergée sur spectre-entertainment.com
  const wpFilter = {
    images: {
      $elemMatch: {
        $type: 'string',
        $regex: WP_HOST_REGEX,
      },
    },
  } as Record<string, unknown>;

  const remainingBefore = await products.countDocuments({ images: { $elemMatch: { $type: 'string', $regex: WP_HOST_REGEX } } });
  console.log('Remaining before:', remainingBefore);

  for (;;) {
    const query: Record<string, unknown> = { ...wpFilter };
    if (lastId) query._id = { $gt: lastId };

    const batch = await products
      .find(query)
      .sort({ _id: 1 })
      .limit(BATCH_SIZE)
      .project({ images: 1 })
      .toArray();

    if (batch.length === 0) break;

    for (const doc of batch) {
      const id = String(doc._id);
      const images = (doc.images as unknown[]) || [];

      const newImages: string[] = await Promise.all(
        images.map((u) => limit(async () => {
          if (isWpImage(u)) {
            const src = String(u);
            try {
              const existing = await getExistingSecureUrl(id, src);
              if (existing) return existing; // repoint to existing Cloudinary resource
              return await uploadFromUrl(id, src); // upload only if missing
            } catch (e) {
              console.error('Cloudinary check/upload failed', id, u, e);
              return src;
            }
          }
          return String(u);
        }))
      );

      if (newImages.some((u, i) => u !== String(images[i] ?? ''))) {
        await products.updateOne(
          { _id: doc._id },
          { $set: { images: newImages, updatedAt: new Date() } }
        );
        updated += 1;
        console.log('Updated', id);
      }
    }

    lastId = batch[batch.length - 1]._id as ObjectId;
  }

  await client.close();
  const afterClient = new MongoClient(mongoUri);
  await afterClient.connect();
  const afterDb = afterClient.db(dbName);
  const afterProducts = afterDb.collection<Document>('products');
  const remainingAfter = await afterProducts.countDocuments({ images: { $elemMatch: { $type: 'string', $regex: WP_HOST_REGEX } } });
  await afterClient.close();
  console.log('Done. Products updated:', updated, '| Remaining after:', remainingAfter);
}

async function main() {
  await migrateProductsImages();
}

main().catch((e) => { console.error(e); process.exit(1); });


