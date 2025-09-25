"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect as useEffectReact } from "react";

type ProductForm = {
  name?: string;
  description?: string;
  shortDescription?: string;
  images?: string[];
  imagePublicIds?: string[];
  visibility?: 'visible' | 'hidden';
  regularPrice?: number;
  salePrice?: number;
  stockQty?: number;
  lengthInches?: number;
  widthInches?: number;
  heightInches?: number;
  categoryIds?: string[];
};

export default function AdminEditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<ProductForm>({ name: "", categoryIds: [] });
  const [allCategories, setAllCategories] = useState<Array<{ _id: string; name: string; depth: number }>>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const isNew = params.id === 'new';

  useEffect(() => {
    async function loadCategories() {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const j = await res.json();
        setAllCategories((j.items || []).map((c: { _id: string; name: string; depth: number }) => ({ _id: c._id, name: c.name, depth: c.depth })));
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
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8 mx-auto w-full max-w-6xl space-y-3">
      <div><Link href="/admin/products" className="text-sm underline">← Retour</Link></div>
      <div className="flex items-center gap-2">
        <button className="ml-auto rounded border px-3 py-1.5 text-sm" onClick={save}>{isNew ? 'Créer' : 'Enregistrer'}</button>
        {!isNew && <button className="rounded border px-3 py-1.5 text-sm text-red-600" onClick={remove}>Supprimer</button>}
      </div>
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex items-center justify-between mb-2">
          <div className="text-lg font-semibold">{isNew ? 'Ajouter un équipement' : 'Éditer un équipement'}</div>
          {!isNew && (
            <div className="flex items-center gap-2">
              <button
                className="rounded border px-3 py-1.5 text-sm"
                onClick={async () => {
                  await fetch(`/api/admin/products/${params.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ featureNow: true }) });
                  const res = await fetch(`/api/admin/products/${params.id}`);
                  if (res.ok) setForm(await res.json());
                  const now = new Date().toLocaleString();
                  setFlash(`Mise en avant mise à jour: ${now}`);
                  setTimeout(() => setFlash(null), 3500);
                }}
              >
                Mettre en avant maintenant
              </button>
            </div>
          )}
        </div>
        {flash && (
          <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{flash}</div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mx-auto w-full max-w-5xl">
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Nom</div>
          <input className="w-full rounded border px-3 py-2 text-sm" value={form.name || ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Description courte</div>
          <input className="w-full rounded border px-3 py-2 text-sm" value={form.shortDescription || ''} onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))} />
        </label>
        <label className="md:col-span-2 text-sm">
          <div className="mb-1 text-gray-600">Description</div>
          <textarea className="w-full rounded border px-3 py-2 text-sm" value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Images</div>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {(form.images || []).map((src, idx) => (
                <div key={`${src}-${idx}`} className="relative w-24 h-20 rounded border overflow-hidden bg-gray-100 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    aria-label="Retirer cette image"
                    title="Retirer cette image"
                    className="absolute top-1 right-1 rounded bg-white/90 text-xs px-1.5 py-0.5 border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      setForm((f) => {
                        const nextImages = Array.from(f.images || []);
                        const nextIds = Array.from(f.imagePublicIds || []);
                        nextImages.splice(idx, 1);
                        if (idx < nextIds.length) nextIds.splice(idx, 1);
                        return { ...f, images: nextImages, imagePublicIds: nextIds };
                      });
                    }}
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              className="w-full rounded border px-3 py-2 text-sm"
              onChange={async (e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                const fd = new FormData();
                Array.from(files).forEach((f) => fd.append('files', f));
                const res = await fetch('/api/admin/cloudinary/upload', { method: 'POST', body: fd });
                if (!res.ok) return;
                const j = await res.json();
                const urls: string[] = (j.items || []).map((it: { url: string }) => it.url);
                const ids: string[] = (j.items || []).map((it: { publicId: string }) => it.publicId);
                setForm((f) => ({ ...f, images: [ ...(f.images || []), ...urls ], imagePublicIds: [ ...(f.imagePublicIds || []), ...ids ] }));
                // reset input value to allow re-upload same files if needed
                e.currentTarget.value = '';
              }}
            />
          </div>
        </label>
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Visible</div>
          <select className="w-full rounded border px-3 py-2 text-sm" value={form.visibility || 'visible'} onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value as 'visible' | 'hidden' }))}>
            <option value="visible">visible</option>
            <option value="hidden">hidden</option>
          </select>
        </label>
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Prix régulier</div>
          <input type="number" step="0.01" className="w-full rounded border px-3 py-2 text-sm" value={form.regularPrice ?? ''} onChange={(e) => setForm((f) => ({ ...f, regularPrice: e.target.value === '' ? undefined : Number(e.target.value) }))} />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Prix spécial</div>
          <input type="number" step="0.01" className="w-full rounded border px-3 py-2 text-sm" value={form.salePrice ?? ''} onChange={(e) => setForm((f) => ({ ...f, salePrice: e.target.value === '' ? undefined : Number(e.target.value) }))} />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Quantité disponible</div>
          <input type="number" className="w-full rounded border px-3 py-2 text-sm" value={form.stockQty ?? ''} onChange={(e) => setForm((f) => ({ ...f, stockQty: Math.max(0, Number(e.target.value) || 0) }))} />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Dimensions (L × l × H) en pouces</div>
          <div className="grid grid-cols-3 gap-2">
            <input type="number" className="w-full rounded border px-3 py-2 text-sm" placeholder="Long." value={form.lengthInches ?? ''} onChange={(e) => setForm((f) => ({ ...f, lengthInches: e.target.value === '' ? undefined : Number(e.target.value) }))} />
            <input type="number" className="w-full rounded border px-3 py-2 text-sm" placeholder="Larg." value={form.widthInches ?? ''} onChange={(e) => setForm((f) => ({ ...f, widthInches: e.target.value === '' ? undefined : Number(e.target.value) }))} />
            <input type="number" className="w-full rounded border px-3 py-2 text-sm" placeholder="Haut." value={form.heightInches ?? ''} onChange={(e) => setForm((f) => ({ ...f, heightInches: e.target.value === '' ? undefined : Number(e.target.value) }))} />
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
                    onChange={(e) => setForm((f) => {
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
      {!isNew && <ProductAudit productId={params.id} />}
    </div>
  );
}

function ProductAudit({ productId }: { productId: string }) {
  const [items, setItems] = useState<Array<{ _id: string; action: string; createdAt?: string; email?: string | null }>>([]);
  useEffectReact(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/audits?resourceId=${encodeURIComponent(productId)}`);
        if (!res.ok) return;
        const j = await res.json();
        setItems(j.items || []);
      } catch {}
    })();
  }, [productId]);
  if (!items.length) return null;
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="text-sm font-semibold mb-2">Historique</div>
      <div className="rounded border bg-white">
        {items.map((e) => (
          <div key={e._id} className="flex items-center justify-between px-3 py-2 border-b text-xs text-gray-700">
            <div>{e.action}</div>
            <div className="text-gray-500">{e.email || '—'} · {e.createdAt ? new Date(e.createdAt).toLocaleString() : ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


