"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

type Quote = { _id: string; createdAt: string; status: string; customer: { name: string; email: string }; totals?: { total: number } | null };

export default function AdminQuotesPage() {
  const [items, setItems] = useState<Quote[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  async function load(p = page) {
    setLoading(true);
    const res = await fetch(`/api/admin/quotes?page=${p}&pageSize=20`);
    if (res.ok) {
      const j = await res.json();
      setItems(j.items || []);
      setTotal(j.total || 0);
      setTotalPages(j.totalPages || 1);
    }
    setLoading(false);
  }

  useEffect(() => { load(1); }, [load]);

  return (
    <div className="min-h-screen py-6">
      <div className="mb-3"><a href="/admin" className="text-sm underline">← Retour</a></div>
      <div className="mb-4 text-lg font-semibold">Demandes de soumission</div>
      <div className="rounded border bg-white text-gray-900">
        <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b text-xs font-semibold text-gray-600">
          <div className="col-span-5">Client</div>
          <div className="col-span-3">Date</div>
          <div className="col-span-2">Statut</div>
          <div className="col-span-1">Total</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
        {loading && (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center px-3 py-2 border-b animate-pulse">
                <div className="col-span-5"><div className="h-3 w-40 bg-gray-100 rounded" /><div className="h-3 w-56 bg-gray-100 rounded mt-1" /></div>
                <div className="col-span-3"><div className="h-3 w-32 bg-gray-100 rounded" /></div>
                <div className="col-span-2"><div className="h-5 w-20 bg-gray-100 rounded" /></div>
                <div className="col-span-1"><div className="h-3 w-14 bg-gray-100 rounded" /></div>
                <div className="col-span-1 text-right"><div className="h-3 w-10 bg-gray-100 rounded ml-auto" /></div>
              </div>
            ))}
          </>
        )}
        {items.map((q) => {
          const status = (q.status || '').toLowerCase();
          const badge = status === 'sent'
            ? 'bg-green-100 text-green-700'
            : status === 'received'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-700';
          return (
            <div key={q._id} className="grid grid-cols-12 gap-2 items-center px-3 py-2 border-b text-sm">
              <div className="col-span-5 min-w-0">
                <div className="font-semibold truncate">{q.customer?.name || '—'}</div>
                <div className="text-gray-600 truncate">{q.customer?.email}</div>
              </div>
              <div className="col-span-3 text-gray-600">{new Date(q.createdAt).toLocaleString()}</div>
              <div className="col-span-2">
                <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${badge}`}>{q.status || '—'}</span>
              </div>
              <div className="col-span-1 font-semibold">{q.totals?.total ? `${q.totals.total.toFixed(2)} $` : '—'}</div>
              <div className="col-span-1 text-right">
                <Link className="text-xs underline" href={`/admin/quotes/${q._id}`}>Ouvrir</Link>
              </div>
            </div>
          );
        })}
        {items.length === 0 && <div className="p-3 text-sm text-gray-500">Aucune demande</div>}
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="text-gray-600">{total} résultats · Page {page} / {totalPages}</div>
        <div className="flex items-center gap-2">
          <button className="rounded border px-3 py-1.5 disabled:opacity-50" disabled={page <= 1} onClick={() => { const p = Math.max(1, page - 1); setPage(p); load(p); }}>Précédent</button>
          <button className="rounded border px-3 py-1.5 disabled:opacity-50" disabled={page >= totalPages} onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); load(p); }}>Suivant</button>
        </div>
      </div>
    </div>
  );
}


