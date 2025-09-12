"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from "next/link";
import { useCallback } from 'react';

export default function AdminQuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [q, setQ] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ _id: string; name: string; images?: string[]; salePrice?: number; regularPrice?: number }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/quotes/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      // enrich missing images from products/by-ids
      try {
        const missing: string[] = ((data.items as Record<string, unknown>[]) || [])
          .filter((it) => !it.image && it.id)
          .map((it) => it.id as string);
        if (missing.length) {
          const r = await fetch(`/api/products/by-ids?ids=${encodeURIComponent(missing.join(','))}`);
          if (r.ok) {
            const byIds = await r.json();
            const imgMap: Record<string, string | undefined> = {};
            for (const it of (byIds.items || [])) imgMap[it._id] = ((it.images as string[]) || [])[0];
            data.items = ((data.items as Record<string, unknown>[]) || []).map((it) => ({ ...it, image: it.image || imgMap[it.id as string] }));
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
    const subject = `Soumission - ${((q?.customer as Record<string, unknown>)?.name as string) || ''}`.trim();
    const intro = 'Veuillez trouver ci-dessous le détail de votre soumission. N'hésitez pas à nous écrire pour toute modification.';
    const footerNote = 'Merci pour votre confiance — Spectre Entertainment';
    const res = await fetch(`/api/admin/quotes/${params.id}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, intro, footerNote }) });
    if (res.ok) router.push('/admin/quotes');
  }

  if (loading) return <div className="p-6 text-sm text-gray-600">Chargement…</div>;
  if (!q) return <div className="p-6 text-sm text-gray-600">Introuvable</div>;

  // Colour hints for missing prices
  const hasMissingPrice = Array.isArray(q.items) && (q.items as Record<string, unknown>[]).some((it) => typeof it.unitPrice !== 'number');

  return (
    <div className="min-h-screen py-6 space-y-3 mx-auto w-full max-w-5xl">
      <div className="flex items-center gap-2">
        <Link href="/admin/quotes" className="text-sm underline">← Retour</Link>
        {hasMissingPrice && <div className="text-xs text-red-600">Des articles n'ont pas de prix — veuillez compléter avant l'envoi.</div>}
        <button className="ml-auto rounded border px-3 py-1.5 text-sm" onClick={save}>Enregistrer</button>
        <button className="rounded border px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50" onClick={sendQuote} disabled={hasMissingPrice}>Envoyer la soumission</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded border bg-white p-3 text-sm">
          <div className="font-medium mb-2">Client</div>
          <div className="grid grid-cols-2 gap-2">
            <label>Nom<input className="w-full rounded border px-2 py-1" value={((q.customer as Record<string, unknown>)?.name as string) || ''} onChange={(e) => setQ((x) => ({ ...x, customer: { ...(x?.customer as Record<string, unknown>), name: e.target.value } }))} /></label>
            <label>Email<input className="w-full rounded border px-2 py-1" value={((q.customer as Record<string, unknown>)?.email as string) || ''} onChange={(e) => setQ((x) => ({ ...x, customer: { ...(x?.customer as Record<string, unknown>), email: e.target.value } }))} /></label>
            <label>Téléphone<input className="w-full rounded border px-2 py-1" value={((q.customer as Record<string, unknown>)?.phone as string) || ''} onChange={(e) => setQ((x) => ({ ...x, customer: { ...(x?.customer as Record<string, unknown>), phone: e.target.value } }))} /></label>
            <label>Entreprise<input className="w-full rounded border px-2 py-1" value={((q.customer as Record<string, unknown>)?.company as string) || ''} onChange={(e) => setQ((x) => ({ ...x, customer: { ...(x?.customer as Record<string, unknown>), company: e.target.value } }))} /></label>
          </div>
        </div>
        <div className="rounded border bg-white p-3 text-sm">
          <div className="font-medium mb-2">Livraison</div>
          <label className="block mb-2">Méthode
            <select className="w-full rounded border px-2 py-1" value={((q.delivery as Record<string, unknown>)?.method as string) || 'pickup'} onChange={(e) => setQ((x) => ({ ...x, delivery: { ...(x?.delivery as Record<string, unknown> || {}), method: e.target.value } }))}>
              <option value="pickup">Ramassage</option>
              <option value="delivery">Livraison</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label>Ligne 1<input className="w-full rounded border px-2 py-1" value={(((q.delivery as Record<string, unknown>)?.address as Record<string, unknown>)?.line1 as string) || ''} onChange={(e) => setQ((x) => ({ ...x, delivery: { ...(x?.delivery as Record<string, unknown> || {}), address: { ...((x?.delivery as Record<string, unknown>)?.address as Record<string, unknown> || {}), line1: e.target.value } } }))} /></label>
            <label>Ligne 2<input className="w-full rounded border px-2 py-1" value={(((q.delivery as Record<string, unknown>)?.address as Record<string, unknown>)?.line2 as string) || ''} onChange={(e) => setQ((x) => ({ ...x, delivery: { ...(x?.delivery as Record<string, unknown> || {}), address: { ...((x?.delivery as Record<string, unknown>)?.address as Record<string, unknown> || {}), line2: e.target.value } } }))} /></label>
            <label>Ville<input className="w-full rounded border px-2 py-1" value={(((q.delivery as Record<string, unknown>)?.address as Record<string, unknown>)?.city as string) || ''} onChange={(e) => setQ((x) => ({ ...x, delivery: { ...(x?.delivery as Record<string, unknown> || {}), address: { ...((x?.delivery as Record<string, unknown>)?.address as Record<string, unknown> || {}), city: e.target.value } } }))} /></label>
            <label>Province<input className="w-full rounded border px-2 py-1" value={(((q.delivery as Record<string, unknown>)?.address as Record<string, unknown>)?.province as string) || ''} onChange={(e) => setQ((x) => ({ ...x, delivery: { ...(x?.delivery as Record<string, unknown> || {}), address: { ...((x?.delivery as Record<string, unknown>)?.address as Record<string, unknown> || {}), province: e.target.value } } }))} /></label>
            <label>Code postal<input className="w-full rounded border px-2 py-1" value={(((q.delivery as Record<string, unknown>)?.address as Record<string, unknown>)?.postalCode as string) || ''} onChange={(e) => setQ((x) => ({ ...x, delivery: { ...(x?.delivery as Record<string, unknown> || {}), address: { ...((x?.delivery as Record<string, unknown>)?.address as Record<string, unknown> || {}), postalCode: e.target.value } } }))} /></label>
          </div>
        </div>
      </div>

      <div className="rounded border bg-white p-3 text-sm">
        <div className="font-medium mb-2">Articles</div>
        <div className="mb-2">
          <div className="text-xs text-gray-600 mb-1">Recherchez et cliquez pour ajouter. Les articles déjà ajoutés sont indiqués.</div>
          <div className="flex items-center gap-2">
            <input className="w-full max-w-sm rounded border px-3 py-2 text-sm" placeholder="Rechercher des produits à ajouter…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <span className="text-xs text-gray-500 min-w-[80px] text-right">{searchLoading ? 'Recherche…' : (searchResults.length ? `${searchResults.length} résultats` : '')}</span>
          </div>
        </div>
        {search && (
          <div className="mb-3 rounded border">
            {searchResults.length === 0 && !searchLoading && <div className="px-3 py-2 text-xs text-gray-500">Aucun résultat</div>}
            {searchResults.map((p: { _id: string; name: string; images?: string[]; salePrice?: number; regularPrice?: number }) => {
              const exists = Array.isArray(q.items) && (q.items as Array<{ id: string }>).some((it) => it.id === p._id);
              return (
                <button
                  key={p._id}
                  className={`w-full flex items-center justify-between px-3 py-2 border-b text-left ${
                    exists ? 'bg-green-50 cursor-not-allowed' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    if (exists) return;
                    setQ((x) => ({ 
                      ...x, 
                      items: [
                        ...((x?.items as Array<Record<string, unknown>>) || []), 
                        { 
                          id: p._id, 
                          name: p.name, 
                          quantity: 1, 
                          unitPrice: p.salePrice ?? p.regularPrice, 
                          image: (p.images || [])[0] 
                        }
                      ] 
                    }));
                  }}
                  disabled={exists}
                  aria-disabled={exists}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={(p.images || [])[0] || ''} alt="" className="h-10 w-14 rounded object-cover border" />
                    <div className="text-sm font-medium truncate">{p.name}</div>
                  </div>
                  <div className="text-sm text-gray-700">
                    {p.salePrice ?? p.regularPrice ? `${(p.salePrice ?? p.regularPrice)?.toFixed(2)} $` : '—'} 
                    {exists && <span className="ml-2 text-green-700 text-xs font-semibold">Ajouté</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {Array.isArray(q.items) && (q.items as Record<string, unknown>[]).map((it, idx: number) => (
          <div key={`${it.id}-${idx}`} className={`grid grid-cols-12 gap-2 items-center border-b py-2 ${!(Number.isFinite(Number(it.unitPrice))) ? 'bg-red-50' : ''}`}>
            <div className="col-span-6 min-w-0 flex items-center gap-3">
              {(it.image as string) ? (
                <img src={it.image as string} alt="" className="h-10 w-14 rounded object-cover border" />
              ) : (
                <div className="h-10 w-14 rounded border bg-gray-100" />
              )}
              <div className="text-sm font-medium truncate">{it.name as string}</div>
            </div>
            <div className="col-span-2">
              <input type="number" step="0.01" className="w-24 rounded border px-2 py-1 text-sm" value={(it.unitPrice as number) ?? ''} onChange={(e) => setQ((x) => {
                const items = [...((x?.items as Array<Record<string, unknown>>) || [])];
                const val = e.target.value === '' ? undefined : Number(e.target.value);
                items[idx] = { ...items[idx], unitPrice: val };
                return { ...x, items };
              })} />
            </div>
            <div className="col-span-2">
              <input type="number" min={1} className="w-20 rounded border px-2 py-1 text-sm" value={(it.quantity as number) || 1} onChange={(e) => setQ((x) => {
                const items = [...((x?.items as Array<Record<string, unknown>>) || [])];
                items[idx] = { ...items[idx], quantity: Math.max(1, Number(e.target.value) || 1) };
                return { ...x, items };
              })} />
            </div>
            <div className="col-span-2 text-right text-sm text-gray-800">
              {Number.isFinite(Number(it.unitPrice)) ? ((Number(it.unitPrice as number) * (Number(it.quantity as number) || 1)).toFixed(2) + ' $') : '—'}
            </div>
          </div>
        ))}

        {/* Totaux */}
        <div className="mt-3 max-w-sm ml-auto text-sm">
          {(() => {
            const subtotal = ((q.items as Array<Record<string, unknown>>) || []).reduce((acc: number, it) => acc + ((Number(it.unitPrice as number) || 0) * (Number(it.quantity as number) || 1)), 0);
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
    </div>
  );
}