"use client";
import Link from "next/link";
import { Eye, X, ChevronLeft, ChevronRight, List, Heart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { addOrUpdateItem, removeItem, loadList } from '@/lib/listStorage';
import CategorySelect from './_components/CategorySelect';
import RealisationsSlider from './_components/RealisationsSlider';
import { useSession } from 'next-auth/react';

type Product = {
  _id: string;
  name: string;
  shortDescription?: string;
  description?: string;
  images?: string[];
  regularPrice?: number;
  salePrice?: number;
  isInStock?: boolean;
  widthInches?: number | string;
  heightInches?: number | string;
  lengthInches?: number | string;
};

type ApiResponse = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: Product[];
};

export default function Home() {
  const { data: session } = useSession();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [categories, setCategories] = useState<Array<{ _id: string; label: string; fullPath: string }>>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewer, setViewer] = useState<Product | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const json = (await res.json()) as { items: Array<{ _id: string; label: string; fullPath: string }> };
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
      }
      try { localStorage.setItem('catalogue:selected', JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
  }

  return (
    <div className="min-h-screen p-4 sm:p-10">
      <header className="mb-6 flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold text-gray-900">Catalogue</h1>
        <input
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          placeholder="Rechercher dans le catalogue..."
          className="w-full max-w-xl rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="ml-auto text-sm text-gray-700 flex items-center gap-3">
          <CategorySelect categories={categories} value={categoryId} onChange={(id) => { setPage(1); setCategoryId(id); }} />
          <Link href="/liste" className="inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm hover:bg-gray-50"><List className="h-4 w-4"/>Ma liste</Link>
          {session?.user && (session.user as any).role === 'admin' && (
            <>
              <Link href="/admin/products" className="hidden sm:inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm hover:bg-gray-50">Admin produits</Link>
              <Link href="/admin/categories" className="hidden sm:inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm hover:bg-gray-50">Admin catégories</Link>
            </>
          )}
        </div>
      </header>

      {loading ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm animate-pulse">
                <div className="aspect-[4/3] bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-100 rounded" />
                  <div className="h-3 w-full bg-gray-100 rounded" />
                  <div className="h-3 w-2/3 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {selectedCategory && (
            <div className="mb-2 text-sm text-gray-600">
              Filtre: <span className="font-medium">{selectedCategory.label}</span> · {data?.total ?? 0} résultats
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((p) => {
              const image = p.images?.[0];
              const isSelected = selectedIds.has(p._id);
              return (
                <div key={p._id} className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
                  <div className="relative aspect-[4/3] bg-gray-50">
                    <button
                      aria-label="Voir les images"
                      title="Voir les images"
                      className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-2 shadow hover:bg-white"
                      onClick={() => {
                        setViewer(p);
                        setViewerIndex(0);
                      }}
                    >
                      <Eye className="h-5 w-5 text-gray-700" />
                    </button>
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Aucune image</div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-base font-semibold text-gray-900 line-clamp-3 leading-snug">{p.name}</div>
                    {formatDims(p) && (
                      <div className="mt-1 text-[11px] text-gray-600">{formatDims(p)}</div>
                    )}
                    <div className="mt-2 flex items-center justify-end">
                      <button
                        className="inline-flex items-center justify-center p-0.5 cursor-pointer"
                        onClick={() => toggleSelectProduct(p)}
                        aria-label={isSelected ? 'Retirer de la liste' : 'Ajouter à la liste'}
                        title={isSelected ? 'Retirer de la liste' : 'Ajouter à la liste'}
                      >
                        <Heart strokeWidth={1.5} fill={isSelected ? 'currentColor' : 'none'} className={`h-5 w-5 ${isSelected ? 'text-red-600' : 'text-gray-500'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {data?.total ?? 0} résultats · Page {data?.page ?? 1} / {data?.totalPages ?? 1}
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 text-sm border rounded disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Précédent
              </button>
              <button
                className="px-3 py-1.5 text-sm border rounded disabled:opacity-50"
                onClick={() => setPage((p) => (data ? Math.min(data.totalPages, p + 1) : p + 1))}
                disabled={data ? page >= data.totalPages : true}
              >
                Suivant
              </button>
            </div>
          </div>

          <RealisationsSlider />
        </>
      )}

      {/* Modal de visualisation */}
      {viewer && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setViewer(null)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="text-lg font-semibold truncate pr-4 text-gray-900">{viewer.name}</div>
                <button
                  aria-label="Fermer"
                  className="rounded p-2 hover:bg-gray-100"
                  onClick={() => setViewer(null)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4">
                <div className="relative w-full aspect-[4/3] bg-gray-50 flex items-center justify-center">
                  {viewer.images && viewer.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={viewer.images[Math.max(0, Math.min(viewerIndex, viewer.images.length - 1))]}
                      alt={viewer.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-sm text-gray-400">Aucune image</div>
                  )}

                  {viewer.images && viewer.images.length > 1 && (
                    <>
                      <button
                        aria-label="Précédente"
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white"
                        onClick={() => setViewerIndex((i) => (i > 0 ? i - 1 : viewer.images ? viewer.images.length - 1 : 0))}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        aria-label="Suivante"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow hover:bg-white"
                        onClick={() => setViewerIndex((i) => (viewer && viewer.images ? (i + 1) % viewer.images.length : 0))}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {viewer.images && viewer.images.length > 1 && (
                  <div className="mt-3 grid grid-flow-col auto-cols-[96px] gap-2 overflow-x-auto pb-2">
                    {viewer.images.map((src, idx) => (
                      <button
                        key={`${src}-${idx}`}
                        className={`relative h-20 w-24 flex-shrink-0 rounded border ${idx === viewerIndex ? 'border-blue-600' : 'border-gray-200'} overflow-hidden`}
                        onClick={() => setViewerIndex(idx)}
                        aria-label={`Image ${idx + 1}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* La gestion de la liste est déplacée vers /liste */}
    </div>
  );
}
