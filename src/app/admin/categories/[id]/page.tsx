"use client";
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCallback } from 'react';

type Category = { _id: string; name: string; fullPath: string; depth: number; parentId: string | null };

export default function AdminCategoryEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === 'new';
  const [form, setForm] = useState<{ name: string; parentId: string | null }>({ name: '', parentId: null });
  const [all, setAll] = useState<Category[]>([]);

  const load = useCallback(async () => {
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
  }, [params.id, isNew]);

  useEffect(() => {
    load();
  }, [load]);

  const parentOptions = useMemo(() => {
    return ([{ _id: '', name: '(aucun parent)', depth: 0 }] as Array<{ _id: string; name: string; depth: number }>).concat(all);
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
    <div className="min-h-screen py-6">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <div><Link href="/admin/categories" className="text-sm underline">← Retour</Link></div>
        
        <div className="bg-white rounded-lg border p-6">
          <h1 className="text-xl font-semibold mb-6">
            {isNew ? 'Nouvelle catégorie' : 'Modifier la catégorie'}
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="text-sm">
              <div className="mb-2 text-gray-700 font-medium">Nom de la catégorie</div>
              <input 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                value={form.name} 
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} 
                placeholder="Nom de la catégorie"
              />
            </label>
            <label className="text-sm">
              <div className="mb-2 text-gray-700 font-medium">Catégorie parent</div>
              <select 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                value={form.parentId || ''} 
                onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value || null }))}
              >
                {parentOptions.map((c) => (
                  <option key={c._id} value={c._id}>{c._id ? `${"— ".repeat(c.depth)}${c.name}` : c.name}</option>
                ))}
              </select>
            </label>
          </div>
          
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t">
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors" 
              onClick={save}
            >
              {isNew ? 'Créer la catégorie' : 'Enregistrer les modifications'}
            </button>
            {!isNew && (
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors" 
                onClick={remove}
              >
                Supprimer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


