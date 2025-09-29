import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { ObjectId, type Collection } from 'mongodb';
import clientPromise from '@/lib/mongodb';

// Types source (JSON brut)
interface RawItem {
  [key: string]: unknown;
}

// Types MongoDB
interface CategoryDoc {
  _id?: ObjectId;
  name: string;
  slug: string;
  parentId?: ObjectId | null;
  fullPath: string; // slugs joinés par '/'
  depth: number; // 0=root
  ancestors: ObjectId[]; // du root au parent
  createdAt: Date;
  updatedAt: Date;
}

interface ProductDoc {
  externalId: number;
  sku?: string | number;
  name: string;
  shortDescription?: string;
  description?: string;
  regularPrice?: number;
  salePrice?: number;
  inventory?: number;
  isInStock?: boolean;
  widthInches?: number | string;
  heightInches?: number | string;
  lengthInches?: number | string;
  weightLbs?: number | string;
  images?: string[];
  imagePublicIds?: string[];
  visibility?: string;
  taxStatus?: string;
  brand?: string;
  // Catégories normalisées pour les filtres
  categoryIds?: ObjectId[]; // feuilles
  allCategoryIds?: ObjectId[]; // feuilles + ancêtres uniques
  // Optionnel: conserver brut
  raw?: RawItem;
}

function parseNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value.replace(/,/g, '.'));
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}

function splitImages(value: unknown): string[] | undefined {
  if (typeof value !== 'string') return undefined;
  const urls = value.split(/\s*,\s*/).map((s) => s.trim()).filter(Boolean);
  return urls.length ? urls : undefined;
}

function slugify(input: string): string {
  return input
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .toLowerCase()
    .replace(/&/g, 'et')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

function parseCategoryChains(value: unknown): string[][] {
  if (typeof value !== 'string' || !value.trim()) return [];
  // Supporte plusieurs séparateurs hiérarchiques: '>', '/', '\\'
  // Ex: "Mobiliers > Chaises, Thématique / Tour du monde, Vase \\ Personnage"
  const HIERARCHY_SPLIT = /[>\/\\]+/; // > or / or \
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((chain) => chain.split(HIERARCHY_SPLIT).map((p) => p.trim()).filter(Boolean))
    .filter((arr) => arr.length > 0);
}

function mapItem(raw: RawItem): Omit<ProductDoc, 'categoryIds' | 'allCategoryIds'> | null {
  const externalId = parseNumber(raw['ID']);
  const name = (raw['Nom'] as string) || '';
  if (!externalId || !name) return null;

  const product: Omit<ProductDoc, 'categoryIds' | 'allCategoryIds'> = {
    externalId,
    sku: (raw['UGS'] as string) ?? undefined,
    name,
    shortDescription: (raw['Description courte'] as string) || undefined,
    description: (raw['Description'] as string) || undefined,
    regularPrice: parseNumber(raw['Tarif régulier']),
    salePrice: parseNumber(raw['Tarif promo']),
    inventory: parseNumber(raw['Inventaire']),
    isInStock: parseNumber(raw['En inventaire?']) ? true : false,
    widthInches: (raw['Largeur (pouce)'] as number | string) ?? undefined,
    heightInches: (raw['Hauteur (pouce)'] as number | string) ?? undefined,
    lengthInches: (raw['Longueur (pouce)'] as number | string) ?? undefined,
    weightLbs: (raw['Poids (livres)'] as number | string) ?? undefined,
    images: splitImages(raw['Images']) ?? undefined,
    visibility: (raw['Visibilité dans le catalogue'] as string) || undefined,
    taxStatus: (raw['Statut fiscal'] as string) || undefined,
    brand: (raw['Brands'] as string) || undefined,
    raw,
  };

  return product;
}

class CategoryManager {
  private cache = new Map<string, ObjectId>(); // fullPath -> _id
  constructor(private collection: Collection<CategoryDoc>) {}

  async ensureIndexes() {
    await Promise.all([
      this.collection.createIndex({ fullPath: 1 }, { unique: true }),
      this.collection.createIndex({ parentId: 1, slug: 1 }, { unique: true }),
    ]);
  }

  private async getOrCreate(fullPath: string, doc: Omit<CategoryDoc, '_id' | 'createdAt' | 'updatedAt'>): Promise<ObjectId> {
    const hit = this.cache.get(fullPath);
    if (hit) return hit;

    const existing = await this.collection.findOne({ fullPath }, { projection: { _id: 1 } });
    if (existing?._id) {
      this.cache.set(fullPath, existing._id);
      return existing._id;
    }

    const now = new Date();
    const insertRes = await this.collection.insertOne({ ...doc, createdAt: now, updatedAt: now });
    const id = insertRes.insertedId;
    this.cache.set(fullPath, id);
    return id;
  }

  async ensureChain(names: string[]): Promise<{ leafId: ObjectId; allIds: ObjectId[] }> {
    const slugs = names.map((n) => slugify(n));
    const allIds: ObjectId[] = [];
    let parentId: ObjectId | null | undefined = null;
    let ancestors: ObjectId[] = [];

    for (let i = 0; i < names.length; i++) {
      const partial = slugs.slice(0, i + 1).join('/');
      const id = await this.getOrCreate(partial, {
        name: names[i],
        slug: slugs[i],
        parentId: parentId ?? null,
        fullPath: partial,
        depth: i,
        ancestors,
      });
      allIds.push(id);
      parentId = id;
      ancestors = [...ancestors, id];
    }

    const leafId = allIds[allIds.length - 1];
    return { leafId, allIds };
  }
}

async function main() {
  const filePath = path.resolve(process.cwd(), 'csvjson.json');
  const rawText = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(rawText) as RawItem[];
  if (!Array.isArray(data)) {
    throw new Error('Le fichier doit contenir un tableau JSON.');
  }

  const client = await clientPromise;
  const db = client.db();
  const products = db.collection<ProductDoc>('products');
  const categories = db.collection<CategoryDoc>('categories');

  // Index produits
  await Promise.all([
    products.createIndex({ externalId: 1 }, { unique: true }),
    products.createIndex({ allCategoryIds: 1 }),
    products.createIndex({ categoryIds: 1 }),
  ]);

  // Index catégories
  const categoryManager = new CategoryManager(categories);
  await categoryManager.ensureIndexes();

  let mapped = 0;
  let upserted = 0;
  const incomingExternalIds = new Set<number>();

  for (const item of data) {
    const base = mapItem(item);
    if (!base) continue;
    mapped++;
    incomingExternalIds.add(base.externalId);

    // Extraire chaînes de catégories
    const chains = parseCategoryChains((item as any)['Catégories']);
    // Catégorie additionnelle (optionnelle) via ENV: IMPORT_EXTRA_CATEGORY_CHAIN="Parent > Enfant"
    const extraChainEnv = process.env.IMPORT_EXTRA_CATEGORY_CHAIN;
    if (extraChainEnv && extraChainEnv.trim()) {
      const extra = extraChainEnv.split('>').map((s) => s.trim()).filter(Boolean);
      if (extra.length) chains.push(extra);
    }

    // Construire les IDs de catégories
    const leafIds: ObjectId[] = [];
    const allIdSet = new Set<string>();

    for (const chain of chains) {
      const { leafId, allIds } = await categoryManager.ensureChain(chain);
      leafIds.push(leafId);
      for (const id of allIds) allIdSet.add(id.toHexString());
    }

    const allCategoryIds = Array.from(allIdSet, (hex) => new ObjectId(hex));

    const { externalId, ...rest } = base;

    // Préserver les images Cloudinary existantes si aucune image entrante n'est fournie
    const existing = await products.findOne({ externalId }, { projection: { images: 1, imagePublicIds: 1, categoryIds: 1, allCategoryIds: 1 } });

    // Construire $set sans undefined pour éviter d'écraser par accident
    const setDoc: Partial<ProductDoc> & { updatedAt: Date } = { updatedAt: new Date() } as any;
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined && k !== 'images') {
        (setDoc as any)[k] = v;
      }
    }
    // Catégories: ne définir que si on en a calculé
    if (leafIds.length) (setDoc as any).categoryIds = leafIds;
    if (allCategoryIds.length) (setDoc as any).allCategoryIds = allCategoryIds;

    // Images: si le JSON contient des images non vides, on les applique; sinon on garde l'existant
    const incomingImages = Array.isArray(rest.images) ? rest.images.filter(Boolean) : [];
    if (incomingImages.length > 0) {
      (setDoc as any).images = incomingImages;
    } else if (existing?.images && existing.images.length > 0) {
      (setDoc as any).images = existing.images;
      if (Array.isArray((existing as any).imagePublicIds)) {
        (setDoc as any).imagePublicIds = (existing as any).imagePublicIds;
      }
    }

    const update = {
      $set: setDoc,
      $setOnInsert: { externalId, createdAt: new Date() },
    } as const;

    const res = await products.updateOne({ externalId }, update, { upsert: true });
    if (res.upsertedCount || res.modifiedCount) upserted++;
  }

  // Suppression des produits absents du nouveau fichier si demandé
  if (process.env.IMPORT_DELETE_MISSING === 'true') {
    const delRes = await products.deleteMany({ externalId: { $nin: Array.from(incomingExternalIds) } });
    console.log(`Supprimés (absents du nouveau JSON): ${delRes.deletedCount}`);
  }

  console.log(`Mapped: ${mapped}, Upserted/Modified: ${upserted}`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
