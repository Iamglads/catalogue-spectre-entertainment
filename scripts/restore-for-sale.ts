import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { ObjectId, type Document } from 'mongodb';
import clientPromise from '@/lib/mongodb';

type Backup = { items: Array<{ _id?: string; externalId?: number; salePriceForSale?: number }> };

async function main() {
  const client = await clientPromise;
  const db = client.db();
  const products = db.collection<Document>('products');
  const categories = db.collection<Document>('categories');

  const dir = path.resolve(process.cwd(), 'scripts', 'backups');
  const files = fs.readdirSync(dir).filter((f) => f.startsWith('for-sale-backup-') && f.endsWith('.json')).sort();
  if (files.length === 0) throw new Error('Aucun backup trouvé');
  const file = path.join(dir, files[files.length - 1]);
  const json = JSON.parse(fs.readFileSync(file, 'utf8')) as Backup;

  const forSale = await categories.findOne({ fullPath: 'decors-a-vendre' }, { projection: { _id: 1 } });
  if (!forSale?._id) throw new Error("Catégorie 'decors-a-vendre' introuvable");

  let updated = 0;
  for (const it of json.items) {
    let prod: Document | null = null;
    if (typeof it.externalId === 'number') {
      prod = await products.findOne({ externalId: it.externalId }, { projection: { _id: 1, categoryIds: 1 } });
    }
    if (!prod && it._id) {
      try { prod = await products.findOne({ _id: new ObjectId(it._id) }, { projection: { _id: 1, categoryIds: 1 } }); } catch {}
    }
    if (!prod) continue;

    const leaves = new Set<string>(Array.isArray(prod.categoryIds) ? (prod.categoryIds as ObjectId[]).map((x) => String(x)) : []);
    leaves.add(String(forSale._id));
    await products.updateOne(
      { _id: prod._id },
      {
        $set: {
          salePriceForSale: typeof it.salePriceForSale === 'number' ? it.salePriceForSale : (undefined as any),
          categoryIds: Array.from(leaves, (s) => new ObjectId(s)),
        }
      }
    );
    updated++;
  }

  console.log(`Restored for-sale data on ${updated} products from ${path.basename(file)}`);
  await client.close();
}

main().catch((e) => { console.error(e); process.exitCode = 1; });


