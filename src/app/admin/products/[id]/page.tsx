"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AdminEditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<any>({ name: "", categoryIds: [] as string[] });
  const [allCategories, setAllCategories] = useState<Array<{ _id: string; name: string; depth: number }>>([]);
  const isNew = params.id === 'new';

  useEffect(() => {
    async function loadCategories() {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const j = await res.json();
        setAllCategories((j.items || []).map((c: any) => ({ _id: c._id, name: c.name, depth: c.depth })));
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    async function load() {
      if (isNew) return;
      const res = await fetch(`/api/admin/products/${params.id}`);
      if (res.ok) setForm(await res.json());
    }
    load();
  }, [params.id]);

  async function save() {
    const url = isNew ? '/api/admin/products' : `/api/admin/products/${params.id}`;
    const method = isNew ? 'POST' : 'PUT';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) router.push('/admin/products');
  }

  async function remove() {
    if (isNew) return;
    const res = await fetch(`/api/admin/products/${params.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/products');
  }

  return (
    <div className="min-h-screen py-6 space-y-3">
      <div><a href="/admin/products" className="text-sm underline">← Retour</a></div>
      <div className="flex items-center gap-2">
        <button className="ml-auto rounded border px-3 py-1.5 text-sm" onClick={save}>{isNew ? 'Créer' : 'Enregistrer'}</button>
        {!isNew && <button className="rounded border px-3 py-1.5 text-sm text-red-600" onClick={remove}>Supprimer</button>}
      </div>
      <div className="mx-auto w-full max-w-5xl">
        <div className="text-lg font-semibold mb-2">{isNew ? 'Ajouter un équipement' : 'Éditer un équipement'}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mx-auto w-full max-w-5xl">
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Nom</div>
          <input className="w-full rounded border px-3 py-2 text-sm" value={form.name || ''} onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Description courte</div>
          <input className="w-full rounded border px-3 py-2 text-sm" value={form.shortDescription || ''} onChange={(e) => setForm((f: any) => ({ ...f, shortDescription: e.target.value }))} />
        </label>
        <label className="md:col-span-2 text-sm">
          <div className="mb-1 text-gray-600">Description</div>
          <textarea className="w-full rounded border px-3 py-2 text-sm" value={form.description || ''} onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))} />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Images (CSV)</div>
          <input className="w-full rounded border px-3 py-2 text-sm" value={(form.images || []).join(', ')} onChange={(e) => setForm((f: any) => ({ ...f, images: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))} />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Visible</div>
          <select className="w-full rounded border px-3 py-2 text-sm" value={form.visibility || 'visible'} onChange={(e) => setForm((f: any) => ({ ...f, visibility: e.target.value }))}>
            <option value="visible">visible</option>
            <option value="hidden">hidden</option>
          </select>
        </label>
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Prix régulier</div>
          <input type="number" step="0.01" className="w-full rounded border px-3 py-2 text-sm" value={form.regularPrice || ''} onChange={(e) => setForm((f: any) => ({ ...f, regularPrice: Number(e.target.value) || undefined }))} />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Prix spécial</div>
          <input type="number" step="0.01" className="w-full rounded border px-3 py-2 text-sm" value={form.salePrice || ''} onChange={(e) => setForm((f: any) => ({ ...f, salePrice: Number(e.target.value) || undefined }))} />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Quantité disponible</div>
          <input type="number" className="w-full rounded border px-3 py-2 text-sm" value={form.stockQty || ''} onChange={(e) => setForm((f: any) => ({ ...f, stockQty: Math.max(0, Number(e.target.value) || 0) }))} />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Dimensions (L × l × H) en pouces</div>
          <div className="grid grid-cols-3 gap-2">
            <input type="number" className="w-full rounded border px-3 py-2 text-sm" placeholder="Long." value={form.lengthInches || ''} onChange={(e) => setForm((f: any) => ({ ...f, lengthInches: Number(e.target.value) || undefined }))} />
            <input type="number" className="w-full rounded border px-3 py-2 text-sm" placeholder="Larg." value={form.widthInches || ''} onChange={(e) => setForm((f: any) => ({ ...f, widthInches: Number(e.target.value) || undefined }))} />
            <input type="number" className="w-full rounded border px-3 py-2 text-sm" placeholder="Haut." value={form.heightInches || ''} onChange={(e) => setForm((f: any) => ({ ...f, heightInches: Number(e.target.value) || undefined }))} />
          </div>
        </label>
        <label className="md:col-span-2 text-sm">
          <div className="mb-1 text-gray-600">Catégories</div>
          <div className="rounded border p-2 max-h-64 overflow-auto space-y-1">
            {allCategories.map((c) => {
              const checked = (form.categoryIds || []).includes(c._id);
              return (
                <label key={c._id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setForm((f: any) => {
                      const set = new Set<string>(f.categoryIds || []);
                      if (e.target.checked) set.add(c._id); else set.delete(c._id);
                      return { ...f, categoryIds: Array.from(set) };
                    })}
                  />
                  <span className="text-gray-400">{"— ".repeat(c.depth)}</span>
                  <span>{c.name}</span>
                </label>
              );
            })}
          </div>
        </label>
      </div>
    </div>
  );
}


