"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect as useEffectReact } from "react";
import { Save, Trash2, Upload, X, Star } from "lucide-react";
import RichTextEditor from "@/app/_components/RichTextEditor";

type ProductForm = {
  name?: string;
  description?: string;
  shortDescription?: string;
  images?: string[];
  imagePublicIds?: string[];
  visibility?: 'visible' | 'hidden';
  regularPrice?: number;
  salePrice?: number;
  salePriceForSale?: number; // Prix de vente
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
  const [flashType, setFlashType] = useState<'success' | 'error' | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
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
  }, [params.id, isNew]);

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const url = isNew ? '/api/admin/products' : `/api/admin/products/${params.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error('Échec de enregistrement');
      setFlash(isNew ? 'Produit créé avec succès' : 'Modifications enregistrées');
      setFlashType('success');
      setTimeout(() => router.push('/admin/products'), 1500);
    } catch (e) {
      setFlash((e as Error).message || 'Une erreur est survenue');
      setFlashType('error');
    } finally {
      setSaving(false);
      setTimeout(() => { setFlash(null); setFlashType(null); }, 3500);
    }
  }

  async function remove() {
    if (isNew || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${params.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Suppression échouée');
      setFlash('Produit supprimé');
      setFlashType('success');
      setTimeout(() => router.push('/admin/products'), 1500);
    } catch (e) {
      setFlash((e as Error).message || 'Une erreur est survenue');
      setFlashType('error');
      setDeleting(false);
    } finally {
      setTimeout(() => { setFlash(null); setFlashType(null); }, 3500);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/products" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 group">
            <svg className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à la liste
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isNew ? 'Nouveau produit' : 'Éditer le produit'}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {isNew ? 'Ajoutez un nouvel article au catalogue' : 'Modifiez les informations du produit'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isNew && (
                <button
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 border border-amber-200 cursor-pointer font-medium text-sm transition-colors"
                  onClick={async () => {
                    try {
                      await fetch(`/api/admin/products/${params.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ featureNow: true }) });
                      const res = await fetch(`/api/admin/products/${params.id}`);
                      if (res.ok) setForm(await res.json());
                      setFlash('Produit mis en vedette');
                      setFlashType('success');
                    } catch {
                      setFlash('Échec de la mise en vedette');
                      setFlashType('error');
                    } finally {
                      setTimeout(() => { setFlash(null); setFlashType(null); }, 3500);
                    }
                  }}
                >
                  <Star className="h-4 w-4" />
                  Vedette
                </button>
              )}
              <button
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md transition-all cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={save}
                disabled={saving}
              >
                <Save className="h-4 w-4" />
                {saving ? 'Enregistrement…' : (isNew ? 'Créer' : 'Enregistrer')}
              </button>
              {!isNew && (
                <button
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm hover:shadow-md transition-all cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={remove}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Flash messages */}
        {flash && (
          <div className={`mb-6 rounded-lg px-4 py-3 shadow-sm ${flashType === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-green-50 border border-green-200 text-green-800'}`}>
            <div className="flex items-center gap-2">
              {flashType === 'error' ? (
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-sm font-medium">{flash}</span>
            </div>
          </div>
        )}

        {/* Form Sections */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations de base</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du produit *</label>
                <input 
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  value={form.name || ''} 
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nom complet du produit"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description courte</label>
                <input 
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  value={form.shortDescription || ''} 
                  onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
                  placeholder="Résumé en une ligne"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description complète (HTML supporté)</label>
                <RichTextEditor
                  value={form.description || ''}
                  onChange={(value) => setForm((f) => ({ ...f, description: value }))}
                  placeholder="Description détaillée du produit (vous pouvez utiliser le formatage)"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
            <div className="space-y-4">
              {(form.images || []).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {(form.images || []).map((src, idx) => (
                    <div key={`${src}-${idx}`} className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-50 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        aria-label="Retirer cette image"
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
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
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <label className="relative cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="sr-only"
                    disabled={uploading}
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      setUploading(true);
                      try {
                        const fd = new FormData();
                        Array.from(files).forEach((f) => fd.append('files', f));
                        const res = await fetch('/api/admin/cloudinary/upload', { method: 'POST', body: fd });
                        if (!res.ok) throw new Error('Upload échoué');
                        const j = await res.json();
                        const urls: string[] = (j.items || []).map((it: { url: string }) => it.url);
                        const ids: string[] = (j.items || []).map((it: { publicId: string }) => it.publicId);
                        setForm((f) => ({ ...f, images: [ ...(f.images || []), ...urls ], imagePublicIds: [ ...(f.imagePublicIds || []), ...ids ] }));
                        e.currentTarget.value = '';
                      } catch {
                        setFlash('Erreur lors du téléchargement');
                        setFlashType('error');
                        setTimeout(() => { setFlash(null); setFlashType(null); }, 3500);
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                  <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <Upload className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {uploading ? 'Téléchargement en cours…' : 'Cliquez pour ajouter des images'}
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Prix et inventaire</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Prix régulier ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  value={form.regularPrice ?? ''} 
                  onChange={(e) => setForm((f) => ({ ...f, regularPrice: e.target.value === '' ? undefined : Number(e.target.value) }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Prix spécial ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  value={form.salePrice ?? ''} 
                  onChange={(e) => setForm((f) => ({ ...f, salePrice: e.target.value === '' ? undefined : Number(e.target.value) }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Prix de vente ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  value={form.salePriceForSale ?? ''} 
                  onChange={(e) => setForm((f) => ({ ...f, salePriceForSale: e.target.value === '' ? undefined : Number(e.target.value) }))}
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">Prix affiché sur la page "Décors à vendre"</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantité disponible</label>
                <input 
                  type="number" 
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  value={form.stockQty ?? ''} 
                  onChange={(e) => setForm((f) => ({ ...f, stockQty: Math.max(0, Number(e.target.value) || 0) }))}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Dimensions & Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dimensions et paramètres</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Dimensions (L × l × H) en pouces</label>
                <div className="grid grid-cols-3 gap-2">
                  <input 
                    type="number" 
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    placeholder="Long." 
                    value={form.lengthInches ?? ''} 
                    onChange={(e) => setForm((f) => ({ ...f, lengthInches: e.target.value === '' ? undefined : Number(e.target.value) }))} 
                  />
                  <input 
                    type="number" 
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    placeholder="Larg." 
                    value={form.widthInches ?? ''} 
                    onChange={(e) => setForm((f) => ({ ...f, widthInches: e.target.value === '' ? undefined : Number(e.target.value) }))} 
                  />
                  <input 
                    type="number" 
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    placeholder="Haut." 
                    value={form.heightInches ?? ''} 
                    onChange={(e) => setForm((f) => ({ ...f, heightInches: e.target.value === '' ? undefined : Number(e.target.value) }))} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Visibilité</label>
                <select 
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  value={form.visibility || 'visible'} 
                  onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value as 'visible' | 'hidden' }))}
                >
                  <option value="visible">Visible</option>
                  <option value="hidden">Caché</option>
                </select>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Catégories</h2>
            <div className="rounded-lg border border-gray-200 p-4 max-h-80 overflow-auto space-y-2">
              {allCategories.map((c) => {
                const checked = (form.categoryIds || []).includes(c._id);
                return (
                  <label key={c._id} className="flex items-center gap-2.5 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={checked}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      onChange={(e) => setForm((f) => {
                        const set = new Set<string>(f.categoryIds || []);
                        if (e.target.checked) set.add(c._id); else set.delete(c._id);
                        return { ...f, categoryIds: Array.from(set) };
                      })}
                    />
                    <span className="text-gray-400 select-none">{"— ".repeat(c.depth)}</span>
                    <span className="text-gray-700">{c.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Audit Log */}
          {!isNew && <ProductAudit productId={params.id} />}
        </div>
      </div>
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique des modifications</h2>
      <div className="space-y-2">
        {items.map((e) => (
          <div key={e._id} className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium text-gray-900">{e.action}</span>
            </div>
            <div className="text-xs text-gray-500">
              {e.email || '—'} · {e.createdAt ? new Date(e.createdAt).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' }) : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


