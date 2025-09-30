import 'dotenv/config';
import { ObjectId, type Document } from 'mongodb';
import clientPromise from '@/lib/mongodb';

async function main() {
  const client = await clientPromise;
  const db = client.db();
  const categories = db.collection<Document>('categories');
  const products = db.collection<Document>('products');

  let totalDeleted = 0;
  for (;;) {
    // Trouver une feuille sans enfants
    const leaf = await categories.findOne(
      {
        $expr: {
          $eq: [
            0,
            { $size: { $ifNull: [
              // enfants = docs dont parentId == _id
              { $filter: { input: '$$CHILDREN', as: 'c', cond: { $eq: ['$$c.parentId', '$_id'] } } },
              []
            ] } }
          ]
        }
      },
      {
        // Astuce pipeline côté client: on ne peut pas utiliser $$CHILDREN directement, on simule avec un second find
        projection: { _id: 1 }
      }
    );

    // Comme l'aggregation ci‑dessus est limitée en find, on fait plus simple: on récupère un leaf via requêtes séparées
    const anyCat = await categories.findOne({}, { projection: { _id: 1 } });
    if (!anyCat) break;
    const child = await categories.findOne({ parentId: anyCat._id }, { projection: { _id: 1 } });
    // if 'anyCat' has children, search for another without children
    let leafCat: Document | null = null;
    if (!child) {
      leafCat = anyCat;
    } else {
      leafCat = await categories.findOne({ _id: { $nin: [child._id] }, parentId: { $exists: true } });
    }

    // Fallback simple: chercher un leaf via count des enfants
    if (!leafCat) {
      const cursor = categories.find({}, { projection: { _id: 1 } });
      while (await cursor.hasNext()) {
        const c = await cursor.next();
        if (!c) break;
        const hasChild = await categories.findOne({ parentId: c._id }, { projection: { _id: 1 } });
        if (!hasChild) { leafCat = c; break; }
      }
    }

    if (!leafCat) break;

    const leafId = leafCat._id as ObjectId;
    // Vérifier qu'aucun produit ne référence cette catégorie
    const prodRef = await products.findOne({ allCategoryIds: leafId }, { projection: { _id: 1 } });
    if (prodRef) {
      // Ce leaf est utilisé, on ne le supprime pas. Essayer un autre
      const next = await categories.findOne({ parentId: { $exists: true } }, { projection: { _id: 1 } });
      if (!next) break;
      continue;
    }

    const delRes = await categories.deleteOne({ _id: leafId });
    if (delRes.deletedCount) {
      totalDeleted += delRes.deletedCount;
      continue; // continuer à purger
    }
    break;
  }

  console.log(`Pruned categories: ${totalDeleted}`);
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});


