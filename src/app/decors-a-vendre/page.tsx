"use client";
import { Eye, X, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { slugify } from '@/lib/slug';
import { addOrUpdateItem, removeItem, loadList } from '@/lib/listStorage';
import ThemeHero from '../_components/ThemeHero';
import ThemedH1 from '../_components/ThemedH1';

type Product = {
  _id: string;
  name: string;
  shortDescription?: string;
  description?: string;
  images?: string[];
  regularPrice?: number;
  salePrice?: number;
  salePriceForSale?: number;
  isInStock?: boolean;
  stockQty?: number;
  widthInches?: number | string;
  heightInches?: number | string;
  lengthInches?: number | string;
  allCategoryIds?: string[];
};

type ApiResponse = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: Product[];
};

function getTagStyles(id: string): { backgroundColor: string; borderColor: string; color: string } {
  let hash = 0 >>> 0;
  for (let i = 0; i < id.length; i++) {
    hash = (((hash << 5) - hash) + id.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  const backgroundColor = `hsla(${hue}, 85%, 85%, 0.75)`;
  const borderColor = `hsla(${hue}, 70%, 60%, 0.55)`;
  const color = `hsl(${hue}, 35%, 25%)`;
  return { backgroundColor, borderColor, color };
}

export default function DecorsAVendrePage() {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewer, setViewer] = useState<Product | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const list = loadList();
      if (list.length) {
        setSelectedIds(new Set(list.map((it) => it.id)));
      }
    } catch {}
  }, []);

  useEffect(() => {
    let canceled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?categoryPath=decors-a-vendre&page=${page}&pageSize=20`);
        if (!res.ok) throw new Error("Failed to load products");
        const json = (await res.json()) as ApiResponse;
        if (!canceled) setData(json);
      } catch (e) {
        console.error(e);
        if (!canceled) setData({ total: 0, page: 1, pageSize: 20, totalPages: 1, items: [] });
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [page]);

  const items = data?.items ?? [];

  function toggleSelectProduct(product: Product) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const id = product._id;
      if (next.has(id)) {
        next.delete(id);
        try { removeItem(id); } catch {}
      } else {
        next.add(id);
        const image = product.images?.[0];
        try { addOrUpdateItem({ id, name: product.name, image, shortDescription: product.shortDescription }, 1); } catch {}
      }
      return next;
    });
  }

  return (
    <>
      <ThemeHero>
        <div className="max-w-3xl">
          <ThemedH1 className="text-display">
            Décors à vendre
          </ThemedH1>
          <p className="mt-3 text-lg text-white/90">
            Découvrez notre sélection exclusive de décors disponibles à l'achat
          </p>
        </div>
      </ThemeHero>

      <div className="container-max section-padding py-8">
        <div className="mb-6">
          <div className="text-caption text-gray-600">{data?.total ?? 0} décors disponibles</div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="aspect-[4/3] skeleton" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-3/4 skeleton" />
                  <div className="h-3 w-full skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun décor à vendre pour le moment</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {items.map((p) => {
                const image = p.images?.[0];
                const isSelected = selectedIds.has(p._id);
                const price = p.salePriceForSale ?? p.salePrice ?? p.regularPrice;
                
                return (
                  <div key={p._id} className="card overflow-hidden hover-lift group animate-fade-in h-full flex flex-col">
                    <div className="relative aspect-[4/3] bg-gray-50">
                      <button
                        aria-label="Voir les images"
                        title="Voir les images"
                        className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 shadow-sm hover:bg-white hover:shadow-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                        onClick={() => {
                          setViewer(p);
                          setViewerIndex(0);
                        }}
                      >
                        <Eye className="h-4 w-4 text-gray-700" />
                      </button>
                      {image ? (
                        <Image
                          src={image}
                          alt={p.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm text-gray-400 bg-gray-100">Aucune image</div>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <Link href={`/produit/${p._id}/${slugify(p.name)}`} className="text-title text-gray-900 line-clamp-2 mb-2 hover:underline">
                        {p.name}
                      </Link>
                      {price && (
                        <div className="text-lg font-semibold text-green-600 mb-2">
                          {price.toFixed(2)} $
                        </div>
                      )}
                      {p.shortDescription && (
                        <p className="text-caption text-gray-600 line-clamp-2 mb-3">{p.shortDescription}</p>
                      )}
                      <div className="mt-auto flex items-center justify-end">
                        <button
                          className="inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-100 transition-colors interactive cursor-pointer"
                          onClick={() => toggleSelectProduct(p)}
                          aria-label={isSelected ? 'Retirer de la liste' : 'Ajouter à la liste'}
                          title={isSelected ? 'Retirer de la liste' : 'Ajouter à la liste'}
                        >
                          <Heart 
                            strokeWidth={1.5} 
                            fill={isSelected ? 'currentColor' : 'none'} 
                            className={`h-5 w-5 transition-colors ${isSelected ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`} 
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 flex items-center justify-between">
              <div className="text-caption">
                {data?.total ?? 0} résultats · Page {data?.page ?? 1} / {data?.totalPages ?? 1}
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Précédent
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setPage((p) => (data ? Math.min(data.totalPages, p + 1) : p + 1))}
                  disabled={data ? page >= data.totalPages : true}
                >
                  Suivant
                </button>
              </div>
            </div>
          </>
        )}

        {/* Modal de visualisation */}
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
    </>
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
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [onClose, onPrev, onNext]);

  const hasImages = Array.isArray(product.images) && product.images.length > 0;
  const currentSrc = hasImages ? product.images![Math.max(0, Math.min(index, product.images!.length - 1))] : undefined;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={product.name}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={dialogRef}
          tabIndex={-1}
          className="w-full max-w-6xl max-h-[90vh] rounded-2xl bg-white shadow-2xl overflow-hidden animate-fade-in flex flex-col"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50 sticky top-0">
            <div className="text-title truncate pr-4 text-gray-900">{product.name}</div>
            <button
              aria-label="Fermer"
              className="rounded-full p-2 hover:bg-gray-200 transition-colors cursor-pointer"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 overflow-auto">
            <div className="relative w-full bg-gray-50 flex items-center justify-center rounded-xl overflow-hidden">
              {hasImages ? (
                <div className="relative w-full h-[70vh]">
                  <Image
                    src={currentSrc!}
                    alt={product.name}
                    fill
                    sizes="100vw"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-full aspect-[4/3] flex items-center justify-center text-sm text-gray-400 bg-gray-100">Aucune image</div>
              )}

              {hasImages && product.images!.length > 1 && (
                <>
                  <button
                    aria-label="Précédente"
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg hover:bg-white hover:shadow-xl transition-all cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    aria-label="Suivante"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg hover:bg-white hover:shadow-xl transition-all cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {hasImages && product.images!.length > 1 && (
              <div className="mt-6 grid grid-flow-col auto-cols-[96px] gap-3 overflow-x-auto pb-2">
                {product.images!.map((src, idx) => (
                  <button
                    key={`${src}-${idx}`}
                    className={`relative h-20 w-24 flex-shrink-0 rounded-lg border-2 ${idx === index ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'} overflow-hidden transition-all`}
                    onClick={() => onSelectIndex(idx)}
                    aria-label={`Image ${idx + 1}`}
                  >
                    <Image src={src} alt="" width={96} height={80} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
