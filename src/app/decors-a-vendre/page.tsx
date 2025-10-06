"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { slugify } from '@/lib/slug';
import { ChevronLeft, ChevronRight, Eye, X } from "lucide-react";

type Product = {
  _id: string;
  name: string;
  shortDescription?: string;
  description?: string;
  images?: string[];
  regularPrice?: number;
  salePrice?: number;
  salePriceForSale?: number; // Prix de vente (différent des prix de location)
  isInStock?: boolean;
  stockQty?: number;
};

type ApiResponse = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: Product[];
};

const CATEGORY_PATH = "decors-a-vendre"; // fullPath (slug) de la catégorie

function ForSaleContent() {
  const [q, setQ] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [viewer, setViewer] = useState<Product | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    p.set("page", String(page));
    p.set("categoryPath", CATEGORY_PATH);
    return p.toString();
  }, [q, page]);

  // Debounce
  useEffect(() => {
    const id = setTimeout(() => setQ(searchDraft), 300);
    return () => clearTimeout(id);
  }, [searchDraft]);

  // Reset page when q changes
  useEffect(() => { setPage(1); }, [q]);

  // Fetch produits
  useEffect(() => {
    let canceled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?${queryString}`);
        if (!res.ok) throw new Error('Failed to load products');
        const json = (await res.json()) as ApiResponse;
        if (!canceled) setData(json);
      } catch (e) {
        console.error(e);
        if (!canceled) setData({ total: 0, page: 1, pageSize: 20, totalPages: 1, items: [] });
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => { canceled = true; };
  }, [queryString]);


  const items = data?.items ?? [];

  return (
    <div className="container-max section-padding py-8">
      <header className="mb-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-display text-gray-900">Décors à vendre</h1>
          <p className="text-gray-600">Articles listés dans la catégorie « Décors à vendre »</p>
        </div>
      </header>

      <div className="mb-6 flex items-stretch gap-3">
        <div className="relative flex-1">
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Rechercher…"
            className="input"
            aria-label="Recherche"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="aspect-[4/3] skeleton" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 skeleton" />
                <div className="h-3 w-full skeleton" />
                <div className="h-3 w-2/3 skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {items.map((p) => {
              const image = p.images?.[0];
              return (
                <div key={p._id} className="card overflow-hidden hover-lift group animate-fade-in h-full flex flex-col">
                  <div className="relative aspect-[4/3] bg-gray-50">
                    <button
                      aria-label="Voir les images"
                      title="Voir les images"
                      className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 shadow-sm hover:bg-white hover:shadow-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      onClick={() => { setViewer(p); setViewerIndex(0); }}
                    >
                      <Eye className="h-4 w-4 text-gray-700" />
                    </button>
                    {image ? (
                      <Image src={image} alt={p.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw" className="object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-gray-400 bg-gray-100">Aucune image</div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <Link href={`/produit/${p._id}/${slugify(p.name)}`} className="text-title text-gray-900 line-clamp-2 mb-2 hover:underline">
                      {p.name}
                    </Link>
                    {/* Prix de vente */}
                    {p.salePriceForSale !== undefined && p.salePriceForSale !== null && (
                      <div className="mt-auto">
                        <div className="text-lg font-bold text-green-600">
                          {p.salePriceForSale === 0 ? 'À donner' : `${p.salePriceForSale.toFixed(2)} $`}
                        </div>
                        <div className="text-xs text-gray-500">Prix de vente</div>
                      </div>
                    )}
                    {/* Quantité réelle si connue */}
                    {typeof p.stockQty === 'number' && (
                      <div className="mt-2 text-xs text-gray-600">Quantité en inventaire: <span className="font-medium">{p.stockQty}</span></div>
                    )}
                    {/* No add to list button for items for sale */}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 flex items-center justify-between">
            <div className="text-caption">{data?.total ?? 0} résultats · Page {data?.page ?? 1} / {data?.totalPages ?? 1}</div>
            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Précédent</button>
              <button className="btn btn-secondary" onClick={() => setPage((p) => (data ? Math.min(data.totalPages, p + 1) : p + 1))} disabled={data ? page >= data.totalPages : true}>Suivant</button>
            </div>
          </div>
        </>
      )}

      {viewer && (
        <ViewerModal
          product={viewer}
          index={viewerIndex}
          onClose={() => setViewer(null)}
          onPrev={() => setViewerIndex((i) => (viewer && viewer.images ? (i > 0 ? i - 1 : viewer.images.length - 1) : 0))}
          onNext={() => setViewerIndex((i) => (viewer && viewer.images ? (i + 1) % viewer.images.length : 0))}
          onSelectIndex={(i) => setViewerIndex(i)}
        />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="container-max section-padding py-8"><div className="text-center text-sm text-gray-500">Chargement…</div></div>}>
      <ForSaleContent />
    </Suspense>
  );
}

type ViewerModalProps = {
  product: Product;
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelectIndex: (i: number) => void;
};

function ViewerModal({ product, index, onClose, onPrev, onNext, onSelectIndex }: ViewerModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); else if (e.key === 'ArrowLeft') onPrev(); else if (e.key === 'ArrowRight') onNext(); }
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [onClose, onPrev, onNext]);

  const hasImages = Array.isArray(product.images) && product.images.length > 0;
  const currentSrc = hasImages ? product.images![Math.max(0, Math.min(index, product.images!.length - 1))] : undefined;

  function cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/\\+/g, '') // Remove backslashes
      .replace(/\\n/g, '\n') // Convert \n to actual line breaks
      .replace(/\n\s*\n/g, '\n') // Remove multiple consecutive line breaks
      .replace(/^\s+$/gm, '') // Remove lines with only whitespace
      .trim();
  }

  const shortText = cleanText(product.shortDescription || '');
  const longText = cleanText(product.description || '');
  const hasShort = Boolean(shortText);
  const hasLong = Boolean(longText);
  const areSame = hasShort && hasLong && shortText === longText;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={product.name}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div ref={dialogRef} tabIndex={-1} className="w-full max-w-6xl max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden animate-fade-in flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 sticky top-0">
            <div className="text-title truncate pr-4 text-gray-900">{product.name}</div>
            <button aria-label="Fermer" className="rounded-full p-2 hover:bg-gray-200 transition-colors cursor-pointer" onClick={onClose}><X className="h-5 w-5" /></button>
          </div>

          <div className="p-6 overflow-auto">
            <div className="relative w-full bg-gray-50 flex items-center justify-center rounded-xl overflow-hidden">
              {hasImages ? (
                <div className="relative w-full h-[70vh]">
                  <Image src={currentSrc!} alt={product.name} fill sizes="100vw" className="object-contain" />
                </div>
              ) : (
                <div className="w-full aspect-[4/3] flex items-center justify-center text-sm text-gray-400 bg-gray-100">Aucune image</div>
              )}

              {hasImages && product.images!.length > 1 && (
                <>
                  <button aria-label="Précédente" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg hover:bg-white hover:shadow-xl transition-all cursor-pointer" onClick={(e) => { e.stopPropagation(); onPrev(); }}><ChevronLeft className="h-5 w-5" /></button>
                  <button aria-label="Suivante" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg hover:bg-white hover:shadow-xl transition-all cursor-pointer" onClick={(e) => { e.stopPropagation(); onNext(); }}><ChevronRight className="h-5 w-5" /></button>
                </>
              )}
            </div>

            {hasImages && product.images!.length > 1 && (
              <div className="mt-6 grid grid-flow-col auto-cols-[96px] gap-3 overflow-x-auto pb-2">
                {product.images!.map((src, idx) => (
                  <button key={`${src}-${idx}`} className={`relative h-20 w-24 flex-shrink-0 rounded-lg border-2 ${idx === index ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'} overflow-hidden transition-all`} onClick={() => onSelectIndex(idx)} aria-label={`Image ${idx + 1}`}>
                    <Image src={src} alt="" width={96} height={80} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {(typeof product.stockQty === 'number' || typeof product.isInStock === 'boolean') && (
              <div className="mt-6">
                {typeof product.stockQty === 'number' ? (
                  <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm">
                    <span className="text-gray-700">Stock:&nbsp;</span>
                    <span className={`font-medium ${product.stockQty > 0 ? 'text-green-600' : 'text-red-600'}`}>{product.stockQty}</span>
                  </div>
                ) : (
                  <div className={`inline-flex items-center rounded-full border px-3 py-1 text-sm ${product.isInStock ? 'text-green-600' : 'text-red-600'}`}>
                    {product.isInStock ? 'En stock' : 'Rupture de stock'}
                  </div>
                )}
              </div>
            )}

            {(hasShort || hasLong) && (
              <div className="mt-6">
                {areSame ? (
                  hasLong ? (
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">{longText}</div>
                  ) : (
                    <div className="text-body text-gray-800 whitespace-pre-line">{shortText}</div>
                  )
                ) : (
                  <>
                    {hasShort && (
                      <div className="text-body text-gray-800 whitespace-pre-line mb-3">
                        <div className="font-medium text-gray-900 mb-1">Description courte:</div>
                        {shortText}
                      </div>
                    )}
                    {hasLong && (
                      <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                        {hasShort && <div className="font-medium text-gray-900 mb-2">Description détaillée:</div>}
                        {longText}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}




