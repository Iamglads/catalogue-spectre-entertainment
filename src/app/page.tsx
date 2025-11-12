"use client";
import { Eye, X, ChevronLeft, ChevronRight, Heart, Search } from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { slugify } from '@/lib/slug';
import { addOrUpdateItem, removeItem, loadList } from '@/lib/listStorage';
import Breadcrumbs from './_components/Breadcrumbs';
import QuickActions from './_components/QuickActions';
import RealisationsSlider from './_components/RealisationsSlider';
import ForSaleSlider from './_components/ForSaleSlider';
import { useSearchParams } from 'next/navigation';
import CategorySelect from './_components/CategorySelect';
import ListCTA from './_components/ListCTA';
import ThemeHero from './_components/ThemeHero';
import ThemedH1 from './_components/ThemedH1';
import SafeHtml from './_components/SafeHtml';
import HomePageSeo from './_components/HomePageSeo';

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
    hash = (((hash << 5) - hash) + id.charCodeAt(i)) >>> 0; // hash * 31 + char
  }
  const hue = hash % 360;
  const backgroundColor = `hsla(${hue}, 85%, 85%, 0.75)`; // pastel with opacity
  const borderColor = `hsla(${hue}, 70%, 60%, 0.55)`; // slightly stronger for border
  const color = `hsl(${hue}, 35%, 25%)`; // readable text
  return { backgroundColor, borderColor, color };
}

function sanitizeCategoryText(text?: string): string {
  // Remove stray backslashes and trim whitespace
  return (text || '').replace(/\\+/g, '').trim();
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [categories, setCategories] = useState<Array<{ _id: string; label: string; fullPath: string; name: string; depth: number }>>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewer, setViewer] = useState<Product | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [ctaOpen, setCtaOpen] = useState(false);
  const [ctaItemName, setCtaItemName] = useState<string | undefined>(undefined);

  // Initialize filters from localStorage or URL params
  useEffect(() => {
    const urlQ = searchParams.get('q');
    const urlCategoryId = searchParams.get('categoryId');
    
    // Priority: URL params > localStorage
    if (urlQ) {
      setQ(urlQ);
      setSearchDraft(urlQ);
    } else {
      // Load from localStorage if no URL params
      try {
        const savedQ = localStorage.getItem('catalogue:filter:q');
        if (savedQ) {
          setQ(savedQ);
          setSearchDraft(savedQ);
        }
      } catch {}
    }
    
    if (urlCategoryId) {
      setCategoryId(urlCategoryId);
    } else {
      // Load from localStorage if no URL params
      try {
        const savedCategoryId = localStorage.getItem('catalogue:filter:categoryId');
        if (savedCategoryId) {
          setCategoryId(savedCategoryId);
        }
      } catch {}
    }
  }, [searchParams]);

  // Persist selection + quantities in localStorage (legacy) and initialize from new list storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('catalogue:selected');
      const rawQty = localStorage.getItem('catalogue:quantities');
      if (raw) setSelectedIds(new Set(JSON.parse(raw)));
      if (rawQty) setQuantities(JSON.parse(rawQty));
      const list = loadList();
      if (list.length) {
        setSelectedIds(new Set(list.map((it) => it.id)));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('catalogue:selected', JSON.stringify(Array.from(selectedIds)));
      localStorage.setItem('catalogue:quantities', JSON.stringify(quantities));
    } catch {}
  }, [selectedIds, quantities]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (categoryId) p.set("categoryId", categoryId);
    p.set("page", String(page));
    return p.toString();
  }, [q, page, categoryId]);

  // Debounce search draft -> q
  useEffect(() => {
    const id = setTimeout(() => {
      setQ(searchDraft);
    }, 300);
    return () => clearTimeout(id);
  }, [searchDraft]);

  // Persist filters to localStorage
  useEffect(() => {
    try {
      if (q.trim()) {
        localStorage.setItem('catalogue:filter:q', q);
      } else {
        localStorage.removeItem('catalogue:filter:q');
      }
    } catch {}
  }, [q]);

  useEffect(() => {
    try {
      if (categoryId) {
        localStorage.setItem('catalogue:filter:categoryId', categoryId);
      } else {
        localStorage.removeItem('catalogue:filter:categoryId');
      }
    } catch {}
  }, [categoryId]);

  // Reset to first page whenever filters change
  useEffect(() => {
    setPage(1);
  }, [q, categoryId]);

  useEffect(() => {
    let canceled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?${queryString}`);
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
  }, [queryString]);

  // Charger les catégories une fois
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) throw new Error('Failed to load categories');
        const json = (await res.json()) as { items: Array<{ _id: string; label: string; fullPath: string; name: string; depth: number }> };
        if (!canceled) setCategories(json.items);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  const items = data?.items ?? [];
  const selectedCategory = useMemo(() => categories.find((c) => c._id === categoryId) || null, [categories, categoryId]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c._id, c])), [categories]);

  function formatDims(p: Product): string | null {
    const L = p.lengthInches;
    const W = p.widthInches;
    const H = p.heightInches;
    if (L || W || H) {
      return `Dim.: ${L ?? '—'} × ${W ?? '—'} × ${H ?? '—'} po`;
    }
    const text = (p.shortDescription || p.description || '').toString();
    if (!text) return null;
    const segs = Array.from(text.matchAll(/(\d+)\s*'\s*(?:(\d+)\s*\")?/g)).map((m) => {
      const ft = Number(m[1] || 0);
      const inch = Number(m[2] || 0);
      return ft * 12 + inch;
    });
    if (segs.length >= 3) {
      return `Dim.: ${segs[0]} × ${segs[1]} × ${segs[2]} po`;
    }
    if (segs.length === 2) {
      return `Dim.: ${segs[0]} × ${segs[1]} po`;
    }
    if (segs.length === 1) {
      return `Dim.: ${segs[0]} po`;
    }
    return null;
  }

  // Sync across tabs/pages when localStorage changes
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'catalogue:selected' && e.newValue) {
        try { setSelectedIds(new Set(JSON.parse(e.newValue))); } catch {}
      }
      if (e.key === 'catalogue:quantities' && e.newValue) {
        try { setQuantities(JSON.parse(e.newValue)); } catch {}
      }
      if (e.key === 'catalogue:list' && e.newValue) {
        try {
          const list = loadList();
          setSelectedIds(new Set(list.map((it) => it.id)));
        } catch {}
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

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
        setCtaItemName(product.name);
        setCtaOpen(true);
      }
      try { localStorage.setItem('catalogue:selected', JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
  }

  return (
    <div className="container-max section-padding py-8">
      <Breadcrumbs />
      
    

      {/* Barre de filtres */}
      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Rechercher un décor…"
            className="input pl-12"
            aria-label="Recherche"
          />
        </div>
        <CategorySelect
          categories={categories
            .filter((c) => c.fullPath !== 'decors-a-vendre' && !/^(?:decors-a-vendre|décors-à-vendre)$/i.test(c.name || ''))
            .map((c) => ({ _id: c._id, label: c.label, fullPath: c.fullPath }))}
          value={categoryId}
          onChange={(id) => setCategoryId(id)}
          placeholder="Catégorie…"
        />
      </div>

      {/* Filtres sélectionnés + compteur */}
      <div className="mb-6 flex flex-col gap-2">
        <div className="text-caption text-gray-600">{data?.total ?? 0} résultats</div>
        {(q.trim() || selectedCategory) && (
          <div className="flex flex-wrap items-center gap-2">
            {q.trim() && (
              <button
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm bg-white hover:bg-gray-50"
                onClick={() => { setSearchDraft(''); setQ(''); }}
                aria-label="Supprimer le filtre de recherche"
              >
                <span className="text-gray-700">Recherche: "{q}"</span>
                <X className="h-3.5 w-3.5 text-gray-500" />
              </button>
            )}
            {selectedCategory && (
              <button
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm bg-white hover:bg-gray-50"
                onClick={() => setCategoryId("")}
                aria-label="Supprimer le filtre catégorie"
              >
                <span className="text-gray-700">{sanitizeCategoryText(selectedCategory.label)}</span>
                <X className="h-3.5 w-3.5 text-gray-500" />
              </button>
            )}
            {(q.trim() || selectedCategory) && (
              <button
                className="ml-1 text-sm text-gray-600 hover:text-gray-900 underline"
                onClick={() => { 
                  setSearchDraft(''); 
                  setQ(''); 
                  setCategoryId(''); 
                  // Clear from localStorage when user explicitly clears
                  try {
                    localStorage.removeItem('catalogue:filter:q');
                    localStorage.removeItem('catalogue:filter:categoryId');
                  } catch {}
                }}
              >
                Effacer tout
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <>
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
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {items.map((p) => {
              const image = p.images?.[0];
              const isSelected = selectedIds.has(p._id);
              const tags = (p.allCategoryIds || [])
                .map((id) => categoryById.get(id))
                .filter(Boolean)
                .filter((c) => c!.name !== 'Décors à vendre') // Hide "Décors à vendre" tag
                .sort((a, b) => (a!.depth - b!.depth))
                .slice(-3); // show deepest up to 3
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
                    {/* Dimensions retirées de la card */}
                    {tags.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {tags.map((c) => {
                          const styles = getTagStyles(c!._id);
                          return (
                            <span key={c!._id} className="text-xs px-2 py-0.5 rounded-full border" style={styles}>
                              {sanitizeCategoryText(c!.name)}
                            </span>
                          );
                        })}
                      </div>
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

          <ForSaleSlider />
          <RealisationsSlider />
        </>
      )}

      {/* Modal de visualisation accessible */}
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
      <ListCTA open={ctaOpen} onClose={() => setCtaOpen(false)} itemName={ctaItemName} />
    </div>
  );
}

export default function Home() {
  return (
    <>
      <ThemeHero>
        <div className="max-w-3xl">
          <ThemedH1 className="text-display">
            Catalogue des décors
          </ThemedH1>
        </div>
      </ThemeHero>
      <Suspense fallback={<div className="container-max section-padding py-8"><div className="text-center text-sm text-gray-500">Chargement…</div></div>}>
        <HomeContent />
      </Suspense>
      <HomePageSeo />
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

  // Keep raw HTML for descriptions
  const shortDescription = product.shortDescription || '';
  const longDescription = product.description || '';
  
  // For text-only display, use clean text
  const shortText = cleanText(shortDescription);
  const longText = cleanText(longDescription);
  const hasShort = Boolean(shortDescription.trim());
  const hasLong = Boolean(longDescription.trim());
  const areSame = hasShort && hasLong && shortText === longText;

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
              {/* Keep within viewport: limit height and width */}
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

            {/* Quantité réelle d'inventaire si connue */}
            {typeof product.stockQty === 'number' && (
              <div className="mt-6">
                <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm">
                  <span className="text-gray-700">Quantité en inventaire:&nbsp;</span>
                  <span className="font-medium text-blue-600">{product.stockQty}</span>
                </div>
              </div>
            )}

            {(hasShort || hasLong) && (
              <div className="mt-6">
                {areSame ? (
                  hasLong ? (
                    <SafeHtml html={longDescription} className="prose prose-sm max-w-none text-gray-700" />
                  ) : (
                    <SafeHtml html={shortDescription} className="text-body text-gray-800" />
                  )
                ) : (
                  <>
                    {hasShort && (
                      <div className="text-body text-gray-800 mb-3">
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
          </div>
        </div>
      </div>
    </div>
  );
}