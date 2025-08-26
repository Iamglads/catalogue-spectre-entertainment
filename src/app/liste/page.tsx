"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ListItemRow, { ProductLite } from "./_components/ListItemRow";
import { loadList, getIds, getQuantitiesMap, removeItem, setQuantity, clearList } from '@/lib/listStorage';
import SendListForm from "./_components/SendListForm";

// moved ProductLite to component file for reuse

export default function ListePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [items, setItems] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const list = loadList();
      setSelectedIds(getIds(list));
      setQuantities(getQuantitiesMap(list));
    } catch {}
  }, []);

  // Sync with other tabs/pages
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'catalogue:list' && e.newValue) {
        try {
          const list = loadList();
          setSelectedIds(getIds(list));
          setQuantities(getQuantitiesMap(list));
        } catch {}
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const idsParam = useMemo(() => selectedIds.join(','), [selectedIds]);

  useEffect(() => {
    if (!idsParam) { setItems([]); return; }
    let canceled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/by-ids?ids=${encodeURIComponent(idsParam)}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const json = (await res.json()) as { items: ProductLite[] };
        if (!canceled) setItems(json.items);
      } catch (e) {
        console.error(e);
        if (!canceled) setItems([]);
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => { canceled = true; };
  }, [idsParam]);

  useEffect(() => {
    // No-op: list storage already persisted by helpers
  }, [selectedIds, quantities]);

  const totalItems = items.length;
  function clearAfterSuccess() {
    setSelectedIds([]);
    setQuantities({});
    try {
      localStorage.removeItem('catalogue:selected');
      localStorage.removeItem('catalogue:quantities');
    } catch {}
  }

  return (
    <div className="min-h-screen p-4 sm:p-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Ma liste</h1>
        <div className="flex items-center gap-2">
          <Link href="/" className="text-sm underline">← Retour au catalogue</Link>
          <button
            className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
            onClick={() => { setSelectedIds([]); setQuantities({}); }}
          >
            Vider
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Chargement…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {totalItems === 0 ? (
              <div className="text-sm text-gray-600">Votre liste est vide. <Link className="underline" href="/">Parcourir le catalogue</Link></div>
            ) : (
              items.map((p) => (
                <ListItemRow
                  key={p._id}
                  product={p}
                  quantity={quantities[p._id] ?? 1}
                  onDecrease={() => { setQuantity(p._id, Math.max(1, (quantities[p._id] || 1) - 1)); setQuantities((q) => ({ ...q, [p._id]: Math.max(1, (q[p._id] || 1) - 1) })); }}
                  onIncrease={() => { setQuantity(p._id, (quantities[p._id] || 1) + 1); setQuantities((q) => ({ ...q, [p._id]: (q[p._id] || 1) + 1 })); }}
                  onChange={(val) => { setQuantity(p._id, val); setQuantities((q) => ({ ...q, [p._id]: val })); }}
                  onRemove={() => { removeItem(p._id); setSelectedIds((prev) => prev.filter((id) => id !== p._id)); }}
                />
              ))
            )}
          </div>
          <div>
            <SendListForm
              selectedIds={selectedIds}
              quantities={quantities}
              onSuccess={() => { clearList(); clearAfterSuccess(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}


