import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { ObjectId, type Document } from 'mongodb';
import clientPromise from '@/lib/mongodb';

type BackupItem = {
  _id: string;
  externalId?: number;
  name?: string;
  salePriceForSale?: number;
};

async function main() {
  const client = await clientPromise;
  const db = client.db();
  const products = db.collection<Document>('products');
  const categories = db.collection<Document>('categories');

  const forSale = await categories.findOne({ fullPath: 'decors-a-vendre' }, { projection: { _id: 1 } });
  if (!forSale?._id) throw new Error("Catégorie 'decors-a-vendre' introuvable");

  const cursor = products.find({ $or: [ { allCategoryIds: forSale._id }, { categoryIds: forSale._id } ] }, { projection: { _id: 1, externalId: 1, name: 1, salePriceForSale: 1 } });

  const items: BackupItem[] = [];
  while (await cursor.hasNext()) {
    const d = await cursor.next();
    if (!d) break;
    items.push({ _id: String(d._id), externalId: d.externalId as number | undefined, name: d.name as string | undefined, salePriceForSale: d.salePriceForSale as number | undefined });
  }

  const dir = path.resolve(process.cwd(), 'scripts', 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const filename = `for-sale-backup-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
  const file = path.join(dir, filename);
  fs.writeFileSync(file, JSON.stringify({ count: items.length, createdAt: new Date().toISOString(), items }, null, 2), 'utf8');
  console.log(`Backup saved: ${file} (items: ${items.length})`);
  await client.close();
}

main().catch((e) => { console.error(e); process.exitCode = 1; });


