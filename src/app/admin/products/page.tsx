"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Pencil, Trash2, Plus } from "lucide-react";

type Product = { _id: string; name: string; images?: string[]; regularPrice?: number; salePrice?: number; categoryIds?: string[]; stockQty?: number; inventory?: number };
type Category = { _id: string; label: string };
type ApiResponse = { total: number; page: number; pageSize: number; totalPages: number; items: Product[] };

export default function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<null | { id: string; name: string }>(null);
  const [removingBusy, setRemovingBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'regularPrice' | 'salePrice'>('regularPrice');
  const [editingValue, setEditingValue] = useState<string>('');
  const [flash, setFlash] = useState<string | null>(null);
  const [flashType, setFlashType] = useState<'success' | 'error' | null>(null);
  const [featuringId, setFeaturingId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastKeyRef = useRef<string>('');

  const load = useCallback(async () => {
    const key = JSON.stringify({ q, status, categoryId, page, pageSize });
    if (key === lastKeyRef.current) return; // avoid duplicate fetch
    lastKeyRef.current = key;
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const url = `/api/admin/products?q=${encodeURIComponent(q)}&status=${status}&page=${page}&pageSize=${pageSize}${categoryId ? `&categoryId=${encodeURIComponent(categoryId)}` : ''}`;
    const res = await fetch(url, { signal: ac.signal });
    if (res.ok) {
      const json = (await res.json()) as ApiResponse;
      setItems(json.items || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 1);
      setError(null);
    } else {
      setItems([]);
      setError('Non autorisé - veuillez vous connecter');
    }
  }, [q, status, categoryId, page, pageSize]);

  // Restore preferences + incoming flash on mount
  useEffect(() => {
    try {
      const s = localStorage.getItem('admin:products:status') as 'all' | 'published' | 'draft' | null;
      const savedQ = localStorage.getItem('admin:products:q');
      const savedCat = localStorage.getItem('admin:products:categoryId');
      if (s) setStatus(s);
      if (savedQ != null) setQ(savedQ);
      if (savedCat != null) setCategoryId(savedCat);
      const msg = sessionStorage.getItem('admin:flash');
      const kind = (sessionStorage.getItem('admin:flashType') as 'success' | 'error' | null);
      if (msg) {
        setFlash(msg);
        setFlashType(kind || 'success');
        setTimeout(() => { setFlash(null); setFlashType(null); }, 3500);
        sessionStorage.removeItem('admin:flash');
        sessionStorage.removeItem('admin:flashType');
      }
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  // Persist preferences
  useEffect(() => {
    try { localStorage.setItem('admin:products:status', status); } catch {}
  }, [status]);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/categories');
        if (r.ok) {
          const j = await r.json() as { items: Array<{ _id: string; label: string }> };
          setCategories(j.items || []);
        }
      } catch {}
    })();
  }, []);
  useEffect(() => {
    try { localStorage.setItem('admin:products:categoryId', categoryId); } catch {}
  }, [categoryId]);

  async function removeItem(id: string) {
    const found = items.find((p) => p._id === id);
    setDeleting(found ? { id, name: found.name } : { id, name: 'cet article' });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 group">
            <svg className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour au tableau de bord
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des décors</h1>
              <p className="mt-1 text-sm text-gray-600">{total} articles au catalogue</p>
            </div>
            <Link 
              href="/admin/products/new" 
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md transition-all cursor-pointer font-medium"
            >
              <Plus className="h-5 w-5" />
              Nouveau produit
            </Link>
          </div>
        </div>

        {/* Flash messages */}
        {flash && (
          <div className={`mb-6 rounded-lg px-4 py-3 shadow-sm ${flashType === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-green-50 border border-green-200 text-green-800'}`}>
            <div className="flex items-center gap-2">
              {flashType === 'error' ? (
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-sm font-medium">{flash}</span>
            </div>
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-lg px-4 py-3 bg-red-50 border border-red-200 text-red-800 shadow-sm">
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Filters Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Recherche</label>
              <input 
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                placeholder="Nom du produit…" 
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Statut</label>
              <select 
                className="w-full sm:w-40 rounded-lg border border-gray-300 px-3.5 py-2 text-sm cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                value={status} 
                onChange={(e) => { const v = e.target.value as 'all' | 'published' | 'draft'; setStatus(v); setPage(1); }}
              >
                <option value="all">Tous</option>
                <option value="published">Publiés</option>
                <option value="draft">Brouillons</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Catégorie</label>
              <select 
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                value={categoryId} 
                onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
              >
                <option value="">Toutes les catégories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-auto sm:self-end">
              <button 
                className="w-full sm:w-auto px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 shadow-sm hover:shadow transition-all cursor-pointer font-medium text-sm" 
                onClick={() => { setPage(1); try { localStorage.setItem('admin:products:q', q); } catch {}; load(); }}
              >
                Filtrer
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="space-y-3">
        {items.map((p) => {
          const price = typeof p.salePrice === 'number' ? p.salePrice : (typeof p.regularPrice === 'number' ? p.regularPrice : undefined);
          const cats = (p.categoryIds || []).map((id) => categories.find((c) => c._id === id)?.label).filter(Boolean).slice(0, 3) as string[];
          return (
            <div key={p._id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all overflow-hidden">
              <div className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Image + Title */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                {p.images?.[0] ? (
                  <Image
                    src={p.images[0]}
                    alt=""
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">{p.name}</h3>
                      {cats.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {cats.map((c) => (
                            <span key={c} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="lg:w-32 flex-shrink-0">
                    <div className="text-xs font-medium text-gray-500 mb-1">Prix</div>
                {editingId === p._id ? (
                  <input
                    autoFocus
                    type="number"
                    step="0.01"
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-right tabular-nums focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={async () => {
                      const num = Number(editingValue);
                      if (Number.isFinite(num)) {
                        await fetch(`/api/admin/products/${p._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [editingField]: num }) });
                        await load();
                      }
                      setEditingId(null);
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        const num = Number(editingValue);
                        if (Number.isFinite(num)) {
                          await fetch(`/api/admin/products/${p._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [editingField]: num }) });
                          await load();
                        }
                        setEditingId(null);
                      } else if (e.key === 'Escape') {
                        setEditingId(null);
                      }
                    }}
                  />
                ) : (
                  <button
                    className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer text-right tabular-nums"
                    onClick={() => {
                      const field: 'regularPrice' | 'salePrice' = typeof p.salePrice === 'number' ? 'salePrice' : 'regularPrice';
                      setEditingField(field);
                      const current = field === 'salePrice' ? p.salePrice : p.regularPrice;
                      setEditingValue(String(current ?? ''));
                      setEditingId(p._id);
                    }}
                    title="Cliquer pour modifier le prix"
                  >
                    {typeof price === 'number' ? `${price.toFixed(2)} $` : '—'}
                  </button>
                )}
                  </div>

                  {/* Stock */}
                  {(() => {
                    const stock = typeof (p as any).stockQty === 'number' ? (p as any).stockQty : (typeof (p as any).inventory === 'number' ? (p as any).inventory : undefined);
                    if (typeof stock === 'number') {
                      return (
                        <div className="lg:w-24 flex-shrink-0 flex items-center justify-center">
                          <span className="inline-flex items-center rounded-md border border-gray-300 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
                            Stock&nbsp;<span className="ml-1 font-semibold text-gray-900">{stock}</span>
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Actions */}
                  <div className="flex items-center gap-2 lg:flex-shrink-0">
                    <button
                      aria-label="Mettre en avant"
                      title="Mettre en avant"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 border border-amber-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                      disabled={featuringId === p._id}
                      onClick={async () => {
                        if (featuringId) return;
                        setFeaturingId(p._id);
                        try {
                          const res = await fetch(`/api/admin/products/${p._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ featureNow: true }) });
                          if (!res.ok) throw new Error('Échec de la mise en avant');
                          await load();
                          const now = new Date().toLocaleString();
                          setFlash(`Mise en avant mise à jour: ${now}`);
                          setFlashType('success');
                        } catch (e) {
                          setFlash((e as Error).message || 'Une erreur est survenue');
                          setFlashType('error');
                        } finally {
                          setTimeout(() => { setFlash(null); setFlashType(null); }, 3500);
                          setFeaturingId(null);
                        }
                      }}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Vedette
                    </button>
                    <Link 
                      aria-label="Éditer" 
                      title="Éditer" 
                      className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors" 
                      href={`/admin/products/${p._id}`}
                    >
                      <Pencil className="h-4 w-4 text-gray-600" />
                    </Link>
                    <button 
                      aria-label="Supprimer" 
                      title="Supprimer" 
                      className="inline-flex items-center justify-center p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer transition-colors" 
                      onClick={() => removeItem(p._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="mt-4 text-base font-medium text-gray-900">Aucun produit trouvé</p>
            <p className="mt-1 text-sm text-gray-500">Essayez d'ajuster vos filtres ou d'ajouter un nouveau produit.</p>
          </div>
        )}
        </div>

        {/* Pagination */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
          <div className="text-sm text-gray-600 font-medium">
            Page <span className="text-gray-900">{page}</span> sur <span className="text-gray-900">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors" 
              disabled={page <= 1} 
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Précédent
            </button>
            <button 
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors" 
              disabled={page >= totalPages} 
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmation suppression */}
      {deleting && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleting(null)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl border bg-white text-gray-900 shadow-2xl">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm text-gray-600">
                  Voulez-vous vraiment supprimer « <span className="font-semibold text-gray-900">{deleting.name}</span> » ? Cette action est irréversible.
                </p>
              </div>
              <div className="px-6 py-4 flex items-center justify-end gap-3 border-t bg-gray-50">
                <button 
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors" 
                  onClick={() => setDeleting(null)}
                >
                  Annuler
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  disabled={removingBusy}
                  onClick={async () => {
                    if (!deleting || removingBusy) return;
                    setRemovingBusy(true);
                    try {
                      const res = await fetch(`/api/admin/products/${deleting.id}`, { method: 'DELETE' });
                      if (!res.ok) throw new Error('Suppression échouée');
                      setDeleting(null);
                      await load();
                      setFlash('Article supprimé');
                      setFlashType('success');
                    } catch (e) {
                      setFlash((e as Error).message || 'Une erreur est survenue');
                      setFlashType('error');
                    } finally {
                      setRemovingBusy(false);
                      setTimeout(() => { setFlash(null); setFlashType(null); }, 3500);
                    }
                  }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


