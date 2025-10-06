"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCallback } from 'react';
import { FileText, Mail, Calendar, DollarSign, ExternalLink } from 'lucide-react';

type Quote = { _id: string; createdAt: string; status: string; customer: { name: string; email: string; phone?: string }; totals?: { total: number } | null; items?: Array<{ name: string; quantity: number }> };

export default function AdminQuotesPage() {
  const [items, setItems] = useState<Quote[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    const res = await fetch(`/api/admin/quotes?page=${p}&pageSize=20`);
    if (res.ok) {
      const j = await res.json();
      setItems(j.items || []);
      setTotal(j.total || 0);
      setTotalPages(j.totalPages || 1);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { load(1); }, [load]);

  const stats = {
    received: items.filter(q => q.status?.toLowerCase() === 'received').length,
    sent: items.filter(q => q.status?.toLowerCase() === 'sent').length,
    totalAmount: items.reduce((sum, q) => sum + (q.totals?.total || 0), 0),
  };

  function getStatusBadge(status: string) {
    const s = (status || '').toLowerCase();
    if (s === 'sent') return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Envoyé' };
    if (s === 'received') return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Reçu' };
    return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: status || '—' };
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
              <h1 className="text-3xl font-bold text-gray-900">Demandes de soumission</h1>
              <p className="mt-1 text-sm text-gray-600">{total} demandes au total</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-50">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Nouvelles demandes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.received}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-50">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Soumissions envoyées</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.sent}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-amber-50">
                  <DollarSign className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Valeur totale</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAmount.toFixed(2)} $</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quotes List */}
        <div className="space-y-3">
          {loading ? (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="h-5 w-48 bg-gray-200 rounded"></div>
                      <div className="h-4 w-64 bg-gray-100 rounded"></div>
                      <div className="h-4 w-32 bg-gray-100 rounded"></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-20 bg-gray-200 rounded-full"></div>
                      <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {items.map((q) => {
                const statusInfo = getStatusBadge(q.status);
                const itemCount = q.items?.length || 0;
                const totalQty = q.items?.reduce((sum, it) => sum + (it.quantity || 0), 0) || 0;
                return (
                  <div key={q._id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all overflow-hidden">
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Customer Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{q.customer?.name || '—'}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{q.customer?.email}</span>
                            </div>
                            {q.customer?.phone && (
                              <div className="flex items-center gap-1.5">
                                <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>{q.customer.phone}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{new Date(q.createdAt).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            {itemCount > 0 && (
                              <div className="flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5" />
                                <span>{itemCount} article{itemCount > 1 ? 's' : ''} · {totalQty} unité{totalQty > 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Amount & Action */}
                        <div className="flex items-center gap-4 lg:flex-shrink-0">
                          {q.totals?.total != null && (
                            <div className="text-right">
                              <div className="text-xs font-medium text-gray-500 mb-0.5">Total</div>
                              <div className="text-xl font-bold text-gray-900 tabular-nums">{q.totals.total.toFixed(2)} $</div>
                            </div>
                          )}
                          <Link 
                            href={`/admin/quotes/${q._id}`}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 shadow-sm hover:shadow transition-all cursor-pointer font-medium text-sm"
                          >
                            Ouvrir
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-4 text-base font-medium text-gray-900">Aucune demande de soumission</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
            <div className="text-sm text-gray-600 font-medium">
              Page <span className="text-gray-900">{page}</span> sur <span className="text-gray-900">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors" 
                disabled={page <= 1} 
                onClick={() => { const p = Math.max(1, page - 1); setPage(p); load(p); }}
              >
                Précédent
              </button>
              <button 
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors" 
                disabled={page >= totalPages} 
                onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); load(p); }}
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


