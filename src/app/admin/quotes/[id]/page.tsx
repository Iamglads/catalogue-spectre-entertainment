"use client";
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import { AlertCircle } from 'lucide-react';
import QuoteHeader from './_components/QuoteHeader';
import QuoteSummaryCard from './_components/QuoteSummaryCard';
import CustomerInfoSection from './_components/CustomerInfoSection';
import DeliverySection from './_components/DeliverySection';
import EmailContentSection from './_components/EmailContentSection';
import InternalNotesSection from './_components/InternalNotesSection';
import QuoteItemsSection from './_components/QuoteItemsSection';
import type { QuoteItem } from './_components/QuoteItemRow';

type QuoteDoc = {
  _id?: string;
  customer?: { name?: string; email?: string; phone?: string; company?: string };
  delivery?: { method?: 'pickup' | 'delivery'; address?: { line1?: string; line2?: string; city?: string; province?: string; postalCode?: string } };
  items?: QuoteItem[];
  subject?: string;
  intro?: string;
  footerNote?: string;
  notes?: string;
  status?: 'draft' | 'sent' | 'pending';
  createdAt?: string | Date;
  updatedAt?: string | Date;
  sentAt?: string | Date;
};

export default function AdminQuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [q, setQ] = useState<QuoteDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendErrors, setSendErrors] = useState<{
    message?: string;
    items: Array<{ index?: number; id?: string; name?: string; unitPriceRaw?: any; unitPriceParsed?: any }>;
    hint?: string;
  }>({ items: [] });

  const parsePriceInput = (v: any): number | undefined => {
    if (v === undefined || v === null) return undefined;
    let s = String(v).trim();
    if (s === '') return undefined;
    s = s.replace(/[\u00A0\s]/g, '');
    s = s.replace(/[^0-9.,-]/g, '');
    if (s === '' || s === '-') return undefined;
    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    let decimalSep: '.' | ',' | null = null;
    if (lastDot >= 0 || lastComma >= 0) {
      if (lastDot >= 0 && lastComma >= 0) decimalSep = lastComma > lastDot ? ',' : '.';
      else decimalSep = lastComma >= 0 ? ',' : '.';
    }
    let cleaned = s;
    if (decimalSep) {
      const otherSep = decimalSep === ',' ? '.' : ',';
      cleaned = cleaned.split(otherSep).join('');
      cleaned = cleaned.replace(decimalSep, '.');
    }
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : undefined;
  };

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/quotes/${params.id}`);
    if (res.ok) {
      const data: QuoteDoc = await res.json();
      try {
        const allIds: string[] = (data.items || []).map((it) => it.id);
        if (allIds.length) {
          const r = await fetch(`/api/products/by-ids?ids=${encodeURIComponent(allIds.join(','))}`);
          if (r.ok) {
            const byIds = await r.json();
            const infoMap: Record<string, { image?: string; stockQty?: number }> = {};
            for (const it of (byIds.items || [])) {
              infoMap[it._id] = { 
                image: (it.images || [])[0], 
                stockQty: it.stockQty 
              };
            }
            data.items = (data.items || []).map((it) => ({ 
              ...it, 
              image: it.image || infoMap[it.id]?.image,
              stockQty: infoMap[it.id]?.stockQty
            }));
          }
        }
      } catch {}
      setQ(data);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/quotes/${params.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q) });
      if (!res.ok) throw new Error('Échec de enregistrement');
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function sendQuote() {
    if (sending) return;
    setSending(true);
    setSendErrors({ items: [] });
    try {
      const res = await fetch(`/api/admin/quotes/${params.id}/send`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subject: q?.subject, 
          intro: q?.intro, 
          footerNote: q?.footerNote 
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setSendErrors(data);
        throw new Error(data.message || 'Échec de l\'envoi');
      }
      await load();
    } finally {
      setSending(false);
    }
  }

  async function remove() {
    if (!confirm('Supprimer cette soumission ?')) return;
    const res = await fetch(`/api/admin/quotes/${params.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/quotes');
  }

  function downloadPdf() {
    if (!q) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Soumission', 14, 20);
    doc.setFontSize(12);
    doc.text(`Client: ${q.customer?.name || '—'}`, 14, 30);
    doc.text(`Courriel: ${q.customer?.email || '—'}`, 14, 36);
    if (q.customer?.phone) doc.text(`Téléphone: ${q.customer.phone}`, 14, 42);
    let y = 52;
    doc.setFontSize(14);
    doc.text('Articles', 14, y);
    y += 8;
    doc.setFontSize(10);
    (q.items || []).forEach((it) => {
      const line = `${it.name} (x${it.quantity})${typeof it.unitPrice === 'number' ? ` - ${it.unitPrice.toFixed(2)} $` : ''}`;
      doc.text(line, 14, y);
      y += 6;
    });
    const totals = calculateTotals(q.items || []);
    if (totals.subtotal > 0) {
      y += 4;
      doc.text(`Sous-total: ${totals.subtotal.toFixed(2)} $`, 14, y);
      y += 6;
      doc.text(`TPS (5%): ${totals.tps.toFixed(2)} $`, 14, y);
      y += 6;
      doc.text(`TVQ (9,975%): ${totals.tvq.toFixed(2)} $`, 14, y);
      y += 6;
      doc.setFontSize(12);
      doc.text(`Total: ${totals.total.toFixed(2)} $`, 14, y);
    }
    doc.save(`soumission-${params.id}.pdf`);
  }

  const calculateTotals = (items: QuoteItem[]) => {
    const TPS_RATE = 0.05;
    const TVQ_RATE = 0.09975;
    const subtotal = items.reduce((acc, it) => {
      const price = typeof it.unitPrice === 'number' ? it.unitPrice : 0;
      return acc + (price * it.quantity);
    }, 0);
    const tps = subtotal * TPS_RATE;
    const tvq = subtotal * TVQ_RATE;
    const total = subtotal + tps + tvq;
    return { subtotal, tps, tvq, total };
  };

  const getStatusInfo = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'sent') return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Envoyée' };
    if (s === 'received') return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Reçue' };
    return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'En attente' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!q) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-gray-500">Soumission introuvable</div>
      </div>
    );
  }

  const totals = calculateTotals(q.items || []);
  const statusInfo = getStatusInfo(q.status);
  const readyToSend = (q.items || []).length > 0 && (q.items || []).every(it => typeof it.unitPrice === 'number');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <QuoteHeader
        statusInfo={statusInfo}
        createdAt={q.createdAt}
        sentAt={q.sentAt}
        readyToSend={readyToSend}
        saving={saving}
        sending={sending}
        onSave={save}
        onSend={sendQuote}
        onDownloadPdf={downloadPdf}
        onDelete={remove}
      />

      {sendErrors.items.length > 0 && (
        <div className="card bg-red-50 border-red-200 text-red-800 p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">{sendErrors.message || 'Erreur lors de l\'envoi'}</div>
              {sendErrors.hint && <div className="text-sm mb-2">{sendErrors.hint}</div>}
              {sendErrors.items.map((e, i) => (
                <div key={i} className="text-sm">
                  Article #{(e.index ?? 0) + 1} ({e.name || e.id}): prix invalide
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <QuoteSummaryCard
        customerName={q.customer?.name}
        customerEmail={q.customer?.email}
        customerPhone={q.customer?.phone}
        subtotal={totals.subtotal}
        tps={totals.tps}
        tvq={totals.tvq}
        total={totals.total}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CustomerInfoSection
            name={q.customer?.name}
            email={q.customer?.email}
            phone={q.customer?.phone}
            company={q.customer?.company}
            onChange={(field, value) => setQ((prev) => ({
              ...prev,
              customer: { ...(prev?.customer || {}), [field]: value }
            }))}
          />

          <DeliverySection
            method={q.delivery?.method}
            address={q.delivery?.address}
            onChange={(method) => setQ((prev) => ({
              ...prev,
              delivery: { ...(prev?.delivery || {}), method }
            }))}
            onAddressChange={(field, value) => setQ((prev) => ({
              ...prev,
              delivery: {
                ...(prev?.delivery || {}),
                address: { ...(prev?.delivery?.address || {}), [field]: value }
              }
            }))}
          />

          <EmailContentSection
            subject={q.subject}
            intro={q.intro}
            footerNote={q.footerNote}
            onChange={(field, value) => setQ((prev) => ({ ...prev, [field]: value }))}
          />

          <InternalNotesSection
            notes={q.notes}
            onChange={(notes) => setQ((prev) => ({ ...prev, notes }))}
          />
        </div>

        <div className="space-y-6">
          <QuoteItemsSection
            items={q.items || []}
            onItemUpdate={(index, field, value) => {
              setQ((prev) => {
                const items = [...(prev?.items || [])];
                items[index] = { ...items[index], [field]: value };
                return { ...prev, items };
              });
            }}
            onItemRemove={(index) => {
              setQ((prev) => {
                const items = [...(prev?.items || [])];
                items.splice(index, 1);
                return { ...prev, items };
              });
            }}
            onItemAdd={async (product) => {
              // Vérifier si le produit existe déjà
              const existingIndex = (q?.items || []).findIndex(item => item.id === product._id);
              
              if (existingIndex !== -1) {
                // Si le produit existe, augmenter la quantité
                setQ((prev) => {
                  const items = [...(prev?.items || [])];
                  const currentQty = items[existingIndex].quantity;
                  const maxQty = items[existingIndex].stockQty;
                  const newQty = typeof maxQty === 'number' ? Math.min(currentQty + 1, maxQty) : currentQty + 1;
                  items[existingIndex] = { ...items[existingIndex], quantity: newQty };
                  return { ...prev, items };
                });
              } else {
                // Sinon, ajouter un nouvel item
                const price = typeof product.salePrice === 'number' ? product.salePrice : (typeof product.regularPrice === 'number' ? product.regularPrice : undefined);
                
                // Récupérer le stockQty pour le nouveau produit
                let stockQty: number | undefined;
                try {
                  const r = await fetch(`/api/products/by-ids?ids=${encodeURIComponent(product._id)}`);
                  if (r.ok) {
                    const data = await r.json();
                    stockQty = data.items?.[0]?.stockQty;
                  }
                } catch {}

                const newItem: QuoteItem = {
                  id: product._id,
                  name: product.name,
                  quantity: 1,
                  unitPrice: price,
                  image: product.images?.[0],
                  stockQty
                };
                setQ((prev) => ({
                  ...prev,
                  items: [...(prev?.items || []), newItem]
                }));
              }
            }}
            parsePriceInput={parsePriceInput}
          />
        </div>
      </div>
    </div>
  );
}
