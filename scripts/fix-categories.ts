import 'dotenv/config';
import { ObjectId, type Collection, type Document, WithId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

type Category = {
  _id: ObjectId;
  name: string;
  slug: string;
  parentId?: ObjectId | null;
  fullPath: string;
  depth: number;
  ancestors: ObjectId[];
};

type Product = {
  _id: ObjectId;
  name: string;
  categoryIds?: ObjectId[];
  allCategoryIds?: ObjectId[];
};

// Règles de fusion: fromFullPath -> toFullPath (slugs, séparés par '/')
const RULES: Array<{ from: string; to: string }> = [
  { from: 'jupes-et-pendrillons', to: 'scenique/rideaux-jupes-et-pendrillons' },
  // Ajouter ici d'autres corrections au besoin
];

async function recomputeAllCategories(
  productsCol: Collection<Product>,
  categoriesCol: Collection<Category>,
  product: WithId<Product>
) {
  const leafIds: ObjectId[] = Array.isArray(product.categoryIds) ? product.categoryIds.filter(Boolean) : [];
  const all = new Set<string>();
  for (const leaf of leafIds) {
    const cat = await categoriesCol.findOne({ _id: leaf }, { projection: { _id: 1, ancestors: 1 } });
    if (cat) {
      for (const anc of (cat.ancestors || [])) all.add(String(anc));
      all.add(String(cat._id));
    }
  }
  const allIds = Array.from(all, (s) => new ObjectId(s));
  await productsCol.updateOne({ _id: product._id }, { $set: { allCategoryIds: allIds } });
}

async function migrate() {
  const client = await clientPromise;
  const db = client.db();
  const products = db.collection<Product>('products');
  const categories = db.collection<Category>('categories');

  for (const rule of RULES) {
    const from = await categories.findOne({ fullPath: rule.from });
    const to = await categories.findOne({ fullPath: rule.to });
    if (!from || !to) {
      console.log(`[skip] rule ${rule.from} -> ${rule.to} (from or to not found)`);
      continue;
    }

    console.log(`Merging '${rule.from}' (${from._id}) -> '${rule.to}' (${to._id})`);

    // Mettre à jour les produits qui référencent la catégorie source
    const cursor = products.find({ categoryIds: from._id });
    let count = 0;
    while (await cursor.hasNext()) {
      const prod = await cursor.next();
      if (!prod) break;
      const leaves = new Set<string>((prod.categoryIds || []).map((x) => String(x)));
      leaves.delete(String(from._id));
      leaves.add(String(to._id));
      const nextLeaves = Array.from(leaves, (s) => new ObjectId(s));
      await products.updateOne({ _id: prod._id }, { $set: { categoryIds: nextLeaves } });
      await recomputeAllCategories(products, categories, prod as WithId<Product>);
      count++;
    }
    console.log(`Updated products: ${count}`);

    // Nettoyer allCategoryIds orphelins (au cas où)
    await products.updateMany(
      { allCategoryIds: from._id },
      { $pull: { allCategoryIds: from._id } }
    );

    // Supprimer la catégorie source
    await categories.deleteOne({ _id: from._id });
    console.log(`Deleted category '${rule.from}'`);
  }

  console.log('Done.');
  await client.close();
}

migrate().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});


