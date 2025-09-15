"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

type Category = { _id: string; name: string; fullPath: string; depth: number; parentId: string | null };

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    const res = await fetch('/api/admin/categories');
    if (res.ok) {
      const j = await res.json();
      setItems(j.items || []);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((c) => c.name.toLowerCase().includes(term) || c.fullPath.toLowerCase().includes(term));
  }, [items, q]);

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8 mx-auto w-full max-w-6xl">
      <div className="mb-3"><Link href="/admin" className="text-sm underline">← Retour</Link></div>
      <div className="mb-4 flex items-center gap-2">
        <input className="rounded border px-2 py-1 text-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Recherche…" />
        <Link href="/admin/categories/new" className="ml-auto inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm hover:bg-gray-50">
          <Plus className="h-4 w-4" />
          Ajouter
        </Link>
      </div>
      <div className="rounded border bg-white text-gray-900">
        {filtered.map((c) => (
          <div key={c._id} className="flex items-center justify-between px-3 py-2 border-b">
            <div className="text-sm"><span className="text-gray-400">{"— ".repeat(c.depth)}</span>{c.name}</div>
            <Link className="text-xs underline" href={`/admin/categories/${c._id}`}>Éditer</Link>
          </div>
        ))}
        {filtered.length === 0 && <div className="p-3 text-sm text-gray-500">Aucun résultat</div>}
      </div>
    </div>
  );
}


