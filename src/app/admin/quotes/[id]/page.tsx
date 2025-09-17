"use client";
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import jsPDF from 'jspdf';

type QuoteItem = { id: string; name: string; quantity: number; unitPrice?: number; image?: string };
type QuoteDoc = {
  _id?: string;
  customer?: { name?: string; email?: string; phone?: string; company?: string };
  delivery?: { method?: 'pickup' | 'delivery'; address?: { line1?: string; line2?: string; city?: string; province?: string; postalCode?: string } };
  items?: QuoteItem[];
  // Email fields
  subject?: string;
  intro?: string;
  footerNote?: string;
  // Internal notes (non envoyées)
  notes?: string;
  // Statut et métadonnées
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
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ _id: string; name: string; images?: string[]; regularPrice?: number; salePrice?: number }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sendErrors, setSendErrors] = useState<{
    message?: string;
    items: Array<{ index?: number; id?: string; name?: string; unitPriceRaw?: any; unitPriceParsed?: any }>;
    hint?: string;
  }>({ items: [] });

  // Helpers to parse price inputs robustly (supports comma decimals)
  const parsePriceInput = (v: string): number | undefined => {
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
      // enrich missing images from products/by-ids
      try {
        const missing: string[] = (data.items || [])
          .filter((it) => !it.image && it.id)
          .map((it) => it.id);
        if (missing.length) {
          const r = await fetch(`/api/products/by-ids?ids=${encodeURIComponent(missing.join(','))}`);
          if (r.ok) {
            const byIds = await r.json();
            const imgMap: Record<string, string | undefined> = {};
            for (const it of (byIds.items || [])) imgMap[it._id] = (it.images || [])[0];
            data.items = (data.items || []).map((it) => ({ ...it, image: it.image || imgMap[it.id] }));
          }
        }
      } catch {}
      setQ(data);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    const res = await fetch(`/api/admin/quotes/${params.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q) });
    if (res.ok) router.push('/admin/quotes');
  }

  async function sendQuote() {
    // Ensure latest edits (including unitPrice) are persisted before sending
    await fetch(`/api/admin/quotes/${params.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q) });
    const subject = (q?.subject?.trim() || `Soumission - ${q?.customer?.name || ''}`).trim();
    const intro = (q?.intro && q.intro.trim()) || 'Veuillez trouver ci-dessous le détail de votre soumission. N’hésitez pas à nous écrire pour toute modification.';
    const footerNote = (q?.footerNote && q.footerNote.trim()) || 'Merci pour votre confiance — Spectre Entertainment';
    const res = await fetch(`/api/admin/quotes/${params.id}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, intro, footerNote }) });
    if (res.ok) {
      router.push('/admin/quotes');
    } else {
      try {
        const data = await res.json();
        setSendErrors({ message: data?.error, items: data?.invalidItems || [], hint: data?.hint });
        const firstIdx = (data?.invalidItems?.[0]?.index ?? 0) as number;
        const el = document.getElementById(`quote-item-${firstIdx}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch {
        setSendErrors({ message: 'Erreur lors de l’envoi.', items: [] });
      }
    }
  }

  function downloadPdf() {
    if (!q) return;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    let y = 60;
    doc.setFontSize(18);
    doc.text('Spectre Entertainment', 48, y);
    y += 16;
    doc.setFontSize(10);
    doc.setTextColor(85);
    doc.text('940 Jean‑Neveu, Longueuil (Québec) J4G 2M1', 48, y);
    y += 32;
    doc.setTextColor(17);
    doc.setFontSize(14);
    doc.text('Soumission', 520, 60, { align: 'right' });
    doc.setFontSize(10);
    doc.setTextColor(85);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 520, 76, { align: 'right' });

    y += 8;
    doc.setFontSize(12);
    doc.setTextColor(17);
    doc.text('Client', 48, y);
    y += 14;
    doc.setFontSize(10);
    doc.setTextColor(51);
    const c = q.customer || {};
    if (c.name) { doc.text(String(c.name), 48, y); y += 14; }
    if (c.email) { doc.text(String(c.email), 48, y); y += 14; }
    if (c.phone) { doc.text(String(c.phone), 48, y); y += 14; }
    if (c.company) { doc.text(String(c.company), 48, y); y += 14; }

    y += 8;
    doc.setFontSize(12);
    doc.setTextColor(17);
    doc.text('Détails', 48, y);
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(51);
    doc.text('Article', 48, y);
    doc.text('Qté', 360, y, { align: 'right' });
    doc.text('Prix', 440, y, { align: 'right' });
    doc.text('Ligne', 520, y, { align: 'right' });
    y += 6; doc.setDrawColor(220); doc.line(48, y, 560, y);
    y += 12;

    let subtotal = 0;
    const rows = (q.items || []) as QuoteItem[];
    rows.forEach((it, idx) => {
      const qty = Math.max(1, Number(it.quantity) || 1);
      const price = Number.isFinite(Number(it.unitPrice)) ? Number(it.unitPrice) : 0;
      const line = qty * price; subtotal += line;
      if (idx % 2 === 1) { doc.setFillColor('#f8f8f8'); doc.rect(48, y - 10, 512, 16, 'F'); }
      doc.setTextColor(17); doc.text(it.name || '', 52, y, { maxWidth: 286 });
      doc.setTextColor(51);
      doc.text(String(qty), 360, y, { align: 'right' });
      doc.text(price ? `${price.toFixed(2)} $` : '—', 440, y, { align: 'right' });
      doc.text(line ? `${line.toFixed(2)} $` : '—', 520, y, { align: 'right' });
      y += 16;
      if (y > 760) {
        // footer with page number
        const page = doc.getNumberOfPages();
        doc.setFontSize(9); doc.setTextColor(150);
        doc.text(`Page ${page}`, 520, 820, { align: 'right' });
        doc.addPage(); y = 60;
      }
    });

    const TPS_RATE = 0.05; const TVQ_RATE = 0.09975;
    const tps = subtotal * TPS_RATE; const tvq = subtotal * TVQ_RATE; const total = subtotal + tps + tvq;
    y += 12;
    doc.setTextColor(17); doc.setFontSize(12); doc.text('Totaux', 360, y);
    y += 14; doc.setFontSize(10); doc.setTextColor(51);
    doc.text(`Sous-total: ${subtotal.toFixed(2)} $`, 360, y); y += 14;
    doc.text(`TPS (5%): ${tps.toFixed(2)} $`, 360, y); y += 14;
    doc.text(`TVQ (9,975%): ${tvq.toFixed(2)} $`, 360, y); y += 16;
    doc.setTextColor(17); doc.setFontSize(12); doc.text(`Total: ${total.toFixed(2)} $`, 360, y);
    y += 28;
    doc.setTextColor(102); doc.setFontSize(10); doc.text('Signature autorisée: _____________________________', 360, y);

    // Footer
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(9); doc.setTextColor(150);
    doc.text(`Page ${pageCount}`, 520, 820, { align: 'right' });

    doc.save(`soumission-${params.id}.pdf`);
  }

  if (loading) return <div className="p-6 text-sm text-gray-600">Chargement…</div>;
  if (!q) return <div className="p-6 text-sm text-gray-600">Introuvable</div>;

  // Colour hints for missing prices (align with server: non-finite numbers are invalid)
  const hasMissingPrice = Array.isArray(q.items) && q.items.some((it) => !Number.isFinite(Number(it.unitPrice)));

  const totals = (() => {
    const subtotal = (q.items || []).reduce((acc: number, it: QuoteItem) => acc + ((Number(it.unitPrice) || 0) * (Number(it.quantity) || 1)), 0);
    const tps = subtotal * 0.05;
    const tvq = subtotal * 0.09975;
    const total = subtotal + tps + tvq;
    return { subtotal, tps, tvq, total };
  })();

  const readyToSend = !hasMissingPrice && Boolean(q.customer?.email);

  const currentStatus: 'draft' | 'sent' | 'pending' = (q.status || (q.sentAt ? 'sent' : 'draft')) as 'draft' | 'sent' | 'pending';
  const statusStyles = currentStatus === 'sent'
    ? 'bg-green-100 text-green-800'
    : currentStatus === 'pending'
    ? 'bg-blue-100 text-blue-800'
    : 'bg-amber-100 text-amber-800';
  const statusLabel = currentStatus === 'sent' ? 'Envoyée' : currentStatus === 'pending' ? 'En cours' : 'Brouillon';
  const fmtDate = (d?: string | Date) => d ? new Date(d).toLocaleString() : undefined;

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8 space-y-3 mx-auto w-full max-w-6xl">
      {sendErrors.items.length > 0 && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <div className="font-medium">{sendErrors.message || 'Certains articles doivent avoir un prix valide.'}</div>
          <ul className="mt-2 space-y-1">
            {sendErrors.items.map((it, i) => (
              <li key={`${it.id}-${i}`}>
                <button
                  className="underline hover:no-underline"
                  onClick={() => {
                    const target = document.getElementById(`quote-item-${it.index ?? i}`);
                    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                >
                  #{(it.index ?? i) + 1} {it.name || ''}
                  {typeof it.unitPriceRaw !== 'undefined' && (
                    <span className="ml-1 text-xs text-red-700">(saisi="{String(it.unitPriceRaw)}" → parsé={String(it.unitPriceParsed)})</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          {sendErrors.hint && <div className="mt-2 text-xs text-red-700">{sendErrors.hint}</div>}
        </div>
      )}
      <div className="sticky top-16 z-10 bg-white/90 backdrop-blur-sm border rounded-lg p-3 flex flex-wrap items-center gap-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles}`}>{statusLabel}</span>
        <div className="min-w-0">
          <div className="text-sm text-gray-500">Soumission pour</div>
          <div className="font-semibold truncate">{q.customer?.name || 'Client sans nom'}</div>
          <div className="text-xs text-gray-600 truncate">{q.customer?.email || '—'} {q.customer?.phone ? ` · ${q.customer.phone}` : ''}</div>
        </div>
        <div className="ml-auto grid grid-cols-4 gap-3 text-sm">
          <div className="text-right"><div className="text-gray-500">Sous-total</div><div className="font-semibold">{totals.subtotal.toFixed(2)} $</div></div>
          <div className="text-right"><div className="text-gray-500">TPS</div><div>{totals.tps.toFixed(2)} $</div></div>
          <div className="text-right"><div className="text-gray-500">TVQ</div><div>{totals.tvq.toFixed(2)} $</div></div>
          <div className="text-right"><div className="text-gray-500">Total</div><div className="font-bold">{totals.total.toFixed(2)} $</div></div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {hasMissingPrice && <div className="text-xs text-red-600">Compléter les prix</div>}
          {!q.customer?.email && <div className="text-xs text-amber-600">Email client requis</div>}
          <button className="rounded border px-3 py-1.5 text-sm" onClick={save}>Enregistrer</button>
          <button className="rounded border px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50" onClick={sendQuote} disabled={!readyToSend}>Envoyer</button>
          <button
            className="rounded border px-3 py-1.5 text-sm bg-red-600 text-white hover:bg-red-700"
            onClick={async () => {
              if (!confirm('Supprimer cette soumission ? Cette action est irréversible.')) return;
              const res = await fetch(`/api/admin/quotes/${params.id}`, { method: 'DELETE' });
              if (res.ok) {
                // Audit logged server-side; redirect to list
                router.push('/admin/quotes');
              }
            }}
          >
            Supprimer
          </button>
        </div>
        {/* Timeline compacte */}
        <div className="basis-full pt-1 text-[11px] text-gray-600 flex items-center gap-3">
          {fmtDate(q.createdAt) && <div>Créée: <span className="text-gray-800">{fmtDate(q.createdAt)}</span></div>}
          {fmtDate(q.updatedAt) && <div>Dernière modif: <span className="text-gray-800">{fmtDate(q.updatedAt)}</span></div>}
          {fmtDate(q.sentAt) && <div>Envoyée: <span className="text-gray-800">{fmtDate(q.sentAt)}</span></div>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded border bg-white p-3 text-sm">
          <div className="font-medium mb-2">Client</div>
          <div className="grid grid-cols-2 gap-2">
            <label>Nom<input className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20" value={q.customer?.name || ''} onChange={(e) => setQ((x) => ({ ...(x as QuoteDoc), customer: { ...(x?.customer || {}), name: e.target.value } }))} /></label>
            <label>Email<input className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20" value={q.customer?.email || ''} onChange={(e) => setQ((x) => ({ ...(x as QuoteDoc), customer: { ...(x?.customer || {}), email: e.target.value } }))} /></label>
            <label>Téléphone<input className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20" value={q.customer?.phone || ''} onChange={(e) => setQ((x) => ({ ...(x as QuoteDoc), customer: { ...(x?.customer || {}), phone: e.target.value } }))} /></label>
            <label>Entreprise<input className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20" value={q.customer?.company || ''} onChange={(e) => setQ((x) => ({ ...(x as QuoteDoc), customer: { ...(x?.customer || {}), company: e.target.value } }))} /></label>
          </div>
        </div>
        <div className="rounded border bg-white p-3 text-sm">
          <div className="font-medium mb-2">Livraison</div>
          <label className="block mb-2">Méthode
            <select className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20" value={q.delivery?.method || 'pickup'} onChange={(e) => setQ((x) => ({ ...(x as QuoteDoc), delivery: { ...((x as QuoteDoc).delivery || {}), method: e.target.value as 'pickup' | 'delivery' } }))}>
              <option value="pickup">Ramassage</option>
              <option value="delivery">Livraison</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label>Ligne 1<input className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20" value={q.delivery?.address?.line1 || ''} onChange={(e) => setQ((x) => ({ ...(x as QuoteDoc), delivery: { ...((x as QuoteDoc).delivery || {}), address: { ...((x as QuoteDoc).delivery?.address || {}), line1: e.target.value } } }))} /></label>
            <label>Ligne 2<input className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20" value={q.delivery?.address?.line2 || ''} onChange={(e) => setQ((x) => ({ ...(x as QuoteDoc), delivery: { ...((x as QuoteDoc).delivery || {}), address: { ...((x as QuoteDoc).delivery?.address || {}), line2: e.target.value } } }))} /></label>
            <label>Ville<input className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20" value={q.delivery?.address?.city || ''} onChange={(e) => setQ((x) => ({ ...(x as QuoteDoc), delivery: { ...((x as QuoteDoc).delivery || {}), address: { ...((x as QuoteDoc).delivery?.address || {}), city: e.target.value } } }))} /></label>
            <label>Province<input className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20" value={q.delivery?.address?.province || ''} onChange={(e) => setQ((x) => ({ ...(x as QuoteDoc), delivery: { ...((x as QuoteDoc).delivery || {}), address: { ...((x as QuoteDoc).delivery?.address || {}), province: e.target.value } } }))} /></label>
            <label>Code postal<input className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20" value={q.delivery?.address?.postalCode || ''} onChange={(e) => setQ((x) => ({ ...(x as QuoteDoc), delivery: { ...((x as QuoteDoc).delivery || {}), address: { ...((x as QuoteDoc).delivery?.address || {}), postalCode: e.target.value } } }))} /></label>
          </div>
        </div>
      </div>

      {/* Soumission (email) */}
      <div className="rounded border bg-white p-3 text-sm">
        <div className="font-medium mb-2">Soumission — Informations d’envoi</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <label className="md:col-span-2">Sujet
            <input
              className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
              placeholder={`Soumission - ${q.customer?.name || ''}`}
              value={q.subject || ''}
              onChange={(e) => setQ((x) => ({ ...(x as QuoteDoc), subject: e.target.value }))}
            />
          </label>
          <label>Message d’introduction
            <textarea
              rows={3}
              className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Veuillez trouver ci-dessous le détail de votre soumission. N’hésitez pas à nous écrire pour toute modification."
              value={q.intro || ''}
              onChange={(e) => setQ((x) => ({ ...(x as QuoteDoc), intro: e.target.value }))}
            />
          </label>
          <label>Note de pied de page
            <textarea
              rows={3}
              className="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Merci pour votre confiance — Spectre Entertainment"
              value={q.footerNote || ''}
              onChange={(e) => setQ((x) => ({ ...(x as QuoteDoc), footerNote: e.target.value }))}
            />
          </label>
        </div>
      </div>

      {/* Notes internes */}
      <div className="rounded border bg-white p-3 text-sm">
        <div className="font-medium mb-2">Notes internes</div>
        <textarea
          rows={4]
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
          placeholder="Notes visibles uniquement par l’équipe (non envoyées au client)."
          value={q.notes || ''}
          onChange={(e) => setQ((x) => ({ ...(x as QuoteDoc), notes: e.target.value }))}
        />
      </div>

      <div className="rounded border bg-white p-3 text-sm">
        <div className="font-medium mb-2">Articles</div>
        <div className="mb-2">
          <div className="text-xs text-gray-600 mb-1">Recherchez et cliquez pour ajouter. Les articles déjà ajoutés sont indiqués.</div>
          <div className="flex items-center gap-2">
            <input className="w-full max-w-sm rounded border px-3 py-2 text-sm" placeholder="Rechercher des décors à ajouter…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <span className="text-xs text-gray-500 min-w-[80px] text-right">{searchLoading ? 'Recherche…' : (searchResults.length ? `${searchResults.length} résultats` : '')}</span>
          </div>
        </div>
        {search && (
          <div className="mb-3 rounded border">
            {searchResults.length === 0 && !searchLoading && <div className="px-3 py-2 text-xs text-gray-500">Aucun résultat</div>}
            {searchResults.map((p) => {
              const exists = Array.isArray(q.items) && q.items.some((it) => it.id === p._id);
              return (
                <button
                  key={p._id}
                  className={`w-full flex items-center justify-between px-3 py-2 border-b text-left ${exists ? 'bg-green-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                  onClick={() => {
                    if (exists) return;
                    setQ((x) => ({ ...((x as QuoteDoc) || {}), items: [ ...(((x as QuoteDoc)?.items) || []), { id: p._id, name: p.name, quantity: 1, unitPrice: p.salePrice ?? p.regularPrice, image: (p.images||[])[0] } ] }));
                  }}
                  disabled={exists}
                  aria-disabled={exists}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={(p.images||[])[0] || ''} alt="" className="h-10 w-14 rounded object-cover border" />
                    <div className="text-sm font-medium truncate">{p.name}</div>
                  </div>
                  <div className="text-sm text-gray-700">{p.salePrice ?? p.regularPrice ? `${(p.salePrice ?? p.regularPrice ?? 0).toFixed(2)} $` : '—'} {exists && <span className="ml-2 text-green-700 text-xs font-semibold">Ajouté</span>}</div>
                </button>
              );
            })}
          </div>
        )}

        {Array.isArray(q.items) && q.items.map((it, idx: number) => {
          const invalid = sendErrors.items.some((e) => (e.index ?? -1) === idx);
          return (
          <div id={`quote-item-${idx}`} key={`${it.id}-${idx}`} className={`grid grid-cols-12 gap-2 items-center border-b py-2 ${invalid || !(Number.isFinite(Number(it.unitPrice))) ? 'bg-red-50' : ''}`}>
            <div className="col-span-6 min-w-0 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {it.image ? (
                <img src={it.image} alt="" className="h-10 w-14 rounded object-cover border" />
              ) : (
                <div className="h-10 w-14 rounded border bg-gray-100" />
              )}
              <div className="text-sm font-medium truncate">{it.name}</div>
            </div>
            <div className="col-span-2">
              <input type="text" inputMode="decimal" className="w-24 rounded border px-2 py-1 text-sm" value={it.unitPrice ?? ''} onChange={(e) => setQ((x) => {
                const items = ([...(((x as QuoteDoc).items) || [])]);
                const val = parsePriceInput(e.target.value);
                items[idx] = { ...items[idx], unitPrice: val } as QuoteItem;
                return { ...((x as QuoteDoc) || {}), items } as QuoteDoc;
              })} />
            </div>
            <div className="col-span-2">
              <div className="flex items-center gap-2">
                <button className="rounded border px-2 py-1 text-sm" onClick={() => setQ((x) => {
                  const items = ([...(((x as QuoteDoc).items) || [])]);
                  const next = Math.max(1, (Number(items[idx].quantity) || 1) - 1);
                  items[idx] = { ...items[idx], quantity: next } as QuoteItem;
                  return { ...((x as QuoteDoc) || {}), items } as QuoteDoc;
                })}>-</button>
                <input type="number" min={1} className="w-16 rounded border px-2 py-1 text-sm text-center" value={it.quantity || 1} onChange={(e) => setQ((x) => {
                  const items = ([...(((x as QuoteDoc).items) || [])]);
                  items[idx] = { ...items[idx], quantity: Math.max(1, Number(e.target.value) || 1) } as QuoteItem;
                  return { ...((x as QuoteDoc) || {}), items } as QuoteDoc;
                })} />
                <button className="rounded border px-2 py-1 text-sm" onClick={() => setQ((x) => {
                  const items = ([...(((x as QuoteDoc).items) || [])]);
                  const next = (Number(items[idx].quantity) || 1) + 1;
                  items[idx] = { ...items[idx], quantity: next } as QuoteItem;
                  return { ...((x as QuoteDoc) || {}), items } as QuoteDoc;
                })}>+</button>
              </div>
            </div>
            <div className="col-span-2 text-right text-sm text-gray-800">
              {Number.isFinite(Number(it.unitPrice)) ? ((Number(it.unitPrice) * (Number(it.quantity) || 1)).toFixed(2) + ' $') : '—'}
            </div>
            <div className="col-span-12 text-right">
              <button className="text-xs text-red-600 underline" onClick={() => setQ((x) => {
                const items = ([...(((x as QuoteDoc).items) || [])]);
                items.splice(idx, 1);
                return { ...((x as QuoteDoc) || {}), items } as QuoteDoc;
              })}>Retirer</button>
            </div>
          </div>
        );})}

        {/* Totaux */}
        <div className="mt-3 max-w-sm ml-auto text-sm">
          {(() => {
            const subtotal = (q.items || []).reduce((acc: number, it: QuoteItem) => acc + ((Number(it.unitPrice) || 0) * (Number(it.quantity) || 1)), 0);
            const tps = subtotal * 0.05;
            const tvq = subtotal * 0.09975;
            const total = subtotal + tps + tvq;
            return (
              <div className="space-y-1">
                <div className="flex items-center justify-between font-semibold"><span>Sous-total</span><span>{subtotal.toFixed(2)} $</span></div>
                <div className="flex items-center justify-between text-gray-600"><span>TPS (5%)</span><span>{tps.toFixed(2)} $</span></div>
                <div className="flex items-center justify-between text-gray-600"><span>TVQ (9,975%)</span><span>{tvq.toFixed(2)} $</span></div>
                <div className="flex items-center justify-between pt-1 text-base font-bold"><span>Total</span><span>{total.toFixed(2)} $</span></div>
              </div>
            );
          })()}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button className="rounded border px-3 py-1.5 text-sm" onClick={() => setQ((x) => ({ ...((x as QuoteDoc) || {}), items: [] }))}>Vider les articles</button>
      </div>
    </div>
  );
}


