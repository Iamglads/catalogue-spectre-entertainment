"use client";
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Category = { _id: string; name: string; fullPath: string; depth: number; parentId: string | null };

export default function AdminCategoryEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === 'new';
  const [form, setForm] = useState<{ name: string; parentId: string | null }>({ name: '', parentId: null });
  const [all, setAll] = useState<Category[]>([]);

  async function load() {
    const listRes = await fetch('/api/admin/categories');
    if (listRes.ok) {
      const j = await listRes.json();
      setAll(j.items || []);
    }
    if (!isNew) {
      const res = await fetch(`/api/admin/categories/${params.id}`);
      if (res.ok) {
        const j = await res.json();
        setForm({ name: j.name || '', parentId: j.parentId ?? null });
      }
    }
  }

  useEffect(() => { load(); }, [params.id]);

  const parentOptions = useMemo(() => {
    return [{ _id: '', name: '(aucun parent)', depth: 0 } as any].concat(all);
  }, [all]);

  async function save() {
    const url = isNew ? '/api/admin/categories' : `/api/admin/categories/${params.id}`;
    const method = isNew ? 'POST' : 'PUT';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) router.push('/admin/categories');
  }

  async function remove() {
    if (isNew) return;
    const res = await fetch(`/api/admin/categories/${params.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/categories');
  }

  return (
    <div className="min-h-screen py-6 space-y-3">
      <div><a href="/admin/categories" className="text-sm underline">← Retour</a></div>
      <div className="flex items-center gap-2">
        <button className="ml-auto rounded border px-3 py-1.5 text-sm" onClick={save}>{isNew ? 'Créer' : 'Enregistrer'}</button>
        {!isNew && <button className="rounded border px-3 py-1.5 text-sm text-red-600" onClick={remove}>Supprimer</button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Nom</div>
          <input className="w-full rounded border px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Parent</div>
          <select className="w-full rounded border px-3 py-2 text-sm" value={form.parentId || ''} onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value || null }))}>
            {parentOptions.map((c) => (
              <option key={c._id} value={c._id}>{c._id ? `${"— ".repeat(c.depth)}${c.name}` : c.name}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}


