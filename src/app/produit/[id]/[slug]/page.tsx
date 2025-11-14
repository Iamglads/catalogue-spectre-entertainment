import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId, type Document } from "mongodb";
import { slugify } from "@/lib/slug";
import ProductGallery from "./ProductGallery";
import SafeHtml from "@/app/_components/SafeHtml";
import AddToListSection from "./AddToListSection";
// No client SEO here; we use server-side Metadata API and JSON-LD

type PageParams = { id: string; slug: string };

function isValidObjectId(id: string): boolean {
  try {
    // ObjectId constructor will throw for invalid hex strings
    // Also ensure round-trip matches to avoid coercion of short values
    const oid = new ObjectId(id);
    return oid.toHexString() === id.toLowerCase();
  } catch {
    return false;
  }
}

function cleanText(text: string): string {
  let t = text
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\\n/g, "\n")
    .replace(/\\/g, "")
    .replace(/\r\n/g, "\n");

  // Ligne par ligne: supprimer les lignes "n" isolées et enlever un 'n' parasite au début d'une ligne de dimensions
  const cleanedLines = t.split("\n").map((line) => {
    const trimmed = line.trim();
    if (/^[nN]$/.test(trimmed)) return ""; // ligne 'n' seule
    return trimmed.replace(/^[nN](?=(\d|['"’”]))/, ""); // 'n' collé devant un chiffre ou une quote
  }).filter((line) => line !== "");

  t = cleanedLines.join("\n")
    .replace(/\n\s*\n/g, "\n")
    .replace(/^\s+$/gm, "")
    .trim();

  return t;
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { id } = params;
  if (!isValidObjectId(id)) return {};
  const client = await clientPromise;
  const db = client.db();
  const products = db.collection<Document>("products");
  const doc = await products.findOne(
    { _id: new ObjectId(id) },
    { projection: { name: 1, images: 1, shortDescription: 1, description: 1, brand: 1 } }
  );
  if (!doc) return {};
  const name = (doc.name as string) || "Produit";
  const image = Array.isArray(doc.images) ? (doc.images[0] as string | undefined) : undefined;
  const canonicalSlug = slugify(name);
  const canonical = `https://spectre-entertainment.com/produit/${String(doc._id)}/${canonicalSlug}`;
  const compactText = (t: string) => t
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\\n/g, "\n")
    .replace(/\\/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const shortText = compactText(String(doc.shortDescription || ""));
  const longText = compactText(String(doc.description || ""));
  const baseDescription = shortText || longText || `Découvrez notre ${name} dans notre vaste catalogue de décors pour tous vos événements.`;
  const description = baseDescription.slice(0, 180);
  const keywords = ["décor", "location", "événementiel", "Montréal", "Longueuil", name];

  return {
    title: `${name} – Décors Spectre`,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      title: `${name} – Décors Spectre`,
      description,
      url: canonical,
      images: image ? [{ url: image, alt: name }] : undefined,
      type: 'website',
    },
  };
}

export default async function ProductDetailPage({ params }: { params: PageParams }) {
  const { id, slug } = params;
  if (!isValidObjectId(id)) return notFound();

  const client = await clientPromise;
  const db = client.db();
  const products = db.collection<Document>("products");
  const doc = await products.findOne(
    {
      _id: new ObjectId(id),
      visibility: "visible",
      $or: [{ "raw.Publié": 1 }, { "raw.Publié": "1" }],
    },
    {
      projection: {
        name: 1,
        images: 1,
        shortDescription: 1,
        description: 1,
        stockQty: 1,
        isInStock: 1,
        widthInches: 1,
        heightInches: 1,
        lengthInches: 1,
        allCategoryIds: 1,
        brand: 1,
      },
    }
  );

  if (!doc) return notFound();

  const name = (doc.name as string) || "Produit";
  const canonicalSlug = slugify(name);
  if (slug !== canonicalSlug) redirect(`/produit/${id}/${canonicalSlug}`);

  const images = (Array.isArray(doc.images) ? (doc.images as unknown[]) : []).filter((u) => typeof u === "string") as string[];

  // Keep raw HTML for descriptions
  const shortDescription = String(doc.shortDescription || "");
  const longDescription = String(doc.description || "");
  
  // For metadata, use clean text
  const shortText = cleanText(shortDescription);
  const longText = cleanText(longDescription);
  const hasShort = Boolean(shortDescription.trim());
  const hasLong = Boolean(longDescription.trim());
  const areSame = hasShort && hasLong && shortText === longText;
  const canonicalUrl = `https://spectre-entertainment.com/produit/${id}/${canonicalSlug}`;
  const baseDescription = shortText || longText || `Découvrez notre ${name} dans notre vaste catalogue de décors pour tous vos événements.`;
  const metaDescription = baseDescription.replace(/\s+/g, ' ').slice(0, 180);
  const brand = typeof (doc as any).brand === 'string' ? String((doc as any).brand) : undefined;
  const keywords = ["décor", "location", "événementiel", "Montréal", "Longueuil", name]; 

  // Load categories for tags
  const categoriesCol = db.collection<Document>("categories");
  const allCatIds = Array.isArray((doc as any).allCategoryIds) ? ((doc as any).allCategoryIds as ObjectId[]) : [];
  const catDocs = allCatIds.length
    ? await categoriesCol.find({ _id: { $in: allCatIds } }, { projection: { name: 1, depth: 1 } }).toArray()
    : [];
  const tags = catDocs
    .filter((c) => typeof c.name === 'string' && (c.name as string).trim() && (c.name as string) !== 'Décors à vendre')
    .sort((a, b) => Number((a.depth as number) ?? 0) - Number((b.depth as number) ?? 0))
    .slice(-3);

  return (
    <div className="container-max section-padding py-8">
      {/* JSON-LD Product (server-rendered) */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name,
            description: metaDescription,
            image: images,
            brand: brand ? { '@type': 'Brand', name: brand } : undefined,
            url: canonicalUrl,
          }),
        }}
      />
      <header className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 flex-1">{name}</h1>
          <AddToListSection
            productId={id}
            productName={name}
            productImage={images[0]}
            productDescription={shortText || longText}
          />
        </div>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((c) => (
              <span key={String(c._id)} className="text-xs px-2 py-0.5 rounded-full border bg-white text-gray-800">
                {String(c.name)}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ProductGallery images={images} name={name} />
        </div>

        <div className="lg:col-span-2">
          {(hasShort || hasLong) && (
            <div className="space-y-3">
              {areSame ? (
                hasLong ? (
                  <SafeHtml html={longDescription} className="prose prose-sm max-w-none text-gray-700" />
                ) : (
                  <SafeHtml html={shortDescription} className="text-body text-gray-800" />
                )
              ) : (
                <>
                  {hasShort && (
                    <div className="text-body text-gray-800">
                      <div className="font-medium text-gray-900 mb-1">Description courte:</div>
                      <SafeHtml html={shortDescription} />
                    </div>
                  )}
                  {hasLong && (
                    <div>
                      {hasShort && <div className="font-medium text-gray-900 mb-2">Description détaillée:</div>}
                      <SafeHtml html={longDescription} className="prose prose-sm max-w-none text-gray-700" />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-gray-700">
            {doc.lengthInches ? <div><span className="text-gray-500">Longueur:&nbsp;</span><span className="font-medium">{String(doc.lengthInches)} po</span></div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}


