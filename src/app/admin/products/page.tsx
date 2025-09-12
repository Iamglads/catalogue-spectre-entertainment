"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useCallback } from "react";

type Product = { _id: string; name: string; images?: string[]; regularPrice?: number; salePrice?: number; categoryIds?: string[] };
type Category = { _id: string; label: string };
type ApiResponse = { total: number; page: number; pageSize: number; totalPages: number; items: Product[] };

export default function AdminProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<null | { id: string; name: string }>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'regularPrice' | 'salePrice'>('regularPrice');
  const [editingValue, setEditingValue] = useState<string>('');
  const abortRef = useRef<AbortController | null>(null);
  const lastKeyRef = useRef<string>('');

  const load = useCallback(async () => {
    const key = JSON.stringify({ q, status, page, pageSize });
    if (key === lastKeyRef.current) return; // avoid duplicate fetch
    lastKeyRef.current = key;
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const url = `/api/admin/products?q=${encodeURIComponent(q)}&status=${status}&page=${page}&pageSize=${pageSize}`;
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
  }, [q, status, page, pageSize]);

  // Restore preferences on mount
  useEffect(() => {
    try {
      const s = localStorage.getItem('admin:products:status') as 'all' | 'published' | 'draft' | null;
      const savedQ = localStorage.getItem('admin:products:q');
      if (s) setStatus(s);
      if (savedQ != null) setQ(savedQ);
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
          const j = await r.json(); 
          setCategories(j.items || []); 
        } 
      } catch {} 
    })(); 
  }, []);

  async function removeItem(id: string) {
    const found = items.find((p) => p._id === id);
    setDeleting(found ? { id, name: found.name } : { id, name: 'cet article' });
  }

  return (
    <div className="min-h-screen py-6">
      <div className="mb-3"><a href="/admin" className="text-sm underline">← Retour</a></div>
      <div className="mb-4 flex items-center gap-2">
        <input className="rounded border px-2 py-1 text-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Recherche…" />
        <button className="rounded border px-3 py-1.5 text-sm" onClick={() => { setPage(1); try { localStorage.setItem('admin:products:q', q); } catch {}; load(); }}>Rechercher</button>
        <select className="rounded border px-2 py-1 text-sm" value={status} onChange={(e) => { setStatus(e.target.value as 'all' | 'published' | 'draft'); setPage(1); }}>
          <option value="all">Tous</option>
          <option value="published">Publiés</option>
          <option value="draft">Brouillons</option>
        </select>
        <Link href="/admin/products/new" className="ml-auto inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm hover:bg-gray-50">
          <Plus className="h-4 w-4" />
          Ajouter
        </Link>
      </div>
      {error && <div className="mb-3 text-xs text-red-600">{error}</div>}
      <div className="rounded border bg-white text-gray-900">
        <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b text-xs font-medium text-gray-600">
          <div className="col-span-6">Article</div>
          <div className="col-span-2">Prix</div>
          <div className="col-span-3">Catégories</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
        {items.map((p) => {
          const price = typeof p.salePrice === 'number' ? p.salePrice : (typeof p.regularPrice === 'number' ? p.regularPrice : undefined);
          const cats = (p.categoryIds || []).map((id) => categories.find((c) => c._id === id)?.label).filter(Boolean).slice(0, 3) as string[];
          return (
            <div key={p._id} className="grid grid-cols-12 gap-2 items-center px-3 py-2 border-b">
              <div className="col-span-6 min-w-0 flex items-center gap-3">
                {p.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt="" className="h-10 w-14 rounded object-cover border" />
                ) : (
                  <div className="h-10 w-14 rounded border bg-gray-100" />
                )}
                <div className="text-sm font-medium truncate">{p.name}</div>
              </div>
              <div className="col-span-2 text-sm text-gray-800">
                {editingId === p._id ? (
                  <input
                    autoFocus
                    type="number"
                    step="0.01"
                    className="w-28 rounded border px-2 py-1 text-sm"
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
                    className="underline decoration-dotted underline-offset-4"
                    onClick={() => {
                      const field: 'regularPrice' | 'salePrice' = typeof p.salePrice === 'number' ? 'salePrice' : 'regularPrice';
                      setEditingField(field);
                      setEditingValue(String((p as Record<string, unknown>)[field] ?? ''));
                      setEditingId(p._id);
                    }}
                    title="Cliquer pour modifier le prix"
                  >
                    {typeof price === 'number' ? `${price.toFixed(2)} $` : '—'}
                  </button>
                )}
              </div>
              <div className="col-span-3 text-xs text-gray-700 truncate">{cats.join(', ') || '—'}</div>
              <div className="col-span-1 flex items-center justify-end gap-2">
                <Link aria-label="Éditer" title="Éditer" className="inline-flex items-center justify-center rounded border p-1.5 hover:bg-gray-50" href={`/admin/products/${p._id}`}>
                  <Pencil className="h-4 w-4" />
                </Link>
                <button aria-label="Supprimer" title="Supprimer" className="inline-flex items-center justify-center rounded border p-1.5 text-red-600 hover:bg-red-50" onClick={() => removeItem(p._id)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
        {items.length === 0 && <div className="p-3 text-sm text-gray-500">Aucun résultat</div>}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="text-gray-600">{total} résultats · Page {page} / {totalPages}</div>
        <div className="flex items-center gap-2">
          <button className="rounded border px-3 py-1.5 disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Précédent</button>
          <button className="rounded border px-3 py-1.5 disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Suivant</button>
        </div>
      </div>

      {/* Modal de confirmation suppression */}
      {deleting && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleting(null)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-md border bg-white text-gray-900 shadow-lg">
              <div className="px-4 py-3 border-b font-semibold">Confirmer la suppression</div>
              <div className="px-4 py-3 text-sm">Voulez-vous vraiment supprimer « {deleting.name} » ? Cette action est irréversible.</div>
              <div className="px-4 py-3 flex items-center justify-end gap-2 border-t">
                <button className="rounded border px-3 py-1.5 text-sm" onClick={() => setDeleting(null)}>Annuler</button>
                <button
                  className="rounded border px-3 py-1.5 text-sm bg-red-600 text-white hover:bg-red-700"
                  onClick={async () => {
                    const res = await fetch(`/api/admin/products/${deleting.id}`, { method: 'DELETE' });
                    if (res.ok) {
                      setDeleting(null);
                      await load();
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


