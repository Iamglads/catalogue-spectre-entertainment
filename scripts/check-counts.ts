import 'dotenv/config';
import clientPromise from '@/lib/mongodb';

async function main() {
  const client = await clientPromise;
  const db = client.db();
  const products = await db.collection('products').estimatedDocumentCount();
  const categories = await db.collection('categories').estimatedDocumentCount();
  console.log(`products=${products}`);
  console.log(`categories=${categories}`);
  await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
