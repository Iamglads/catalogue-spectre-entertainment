"use client";
import React, { useState } from "react";

type Props = {
  selectedIds: string[];
  quantities: Record<string, number>;
  onSuccess: () => void;
};

export default function SendListForm({ selectedIds, quantities, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<null | { ok: boolean; error?: string }>(null);
  const [postalCode, setPostalCode] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>("pickup");
  const [addr1, setAddr1] = useState("");
  const [addr2, setAddr2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("QC");

  const missing: string[] = [];
  if (!name) missing.push('nom');
  if (!email) missing.push('email');
  if (!phone) missing.push('téléphone');
  if (selectedIds.length === 0) missing.push('au moins un article');
  if (deliveryMethod === 'delivery') {
    if (!addr1) missing.push('adresse');
    if (!city) missing.push('ville');
    if (!province) missing.push('province');
    if (!postalCode) missing.push('code postal');
  }
  const canSend = missing.length === 0 && !sending;

  async function handleSend() {
    try {
      setSending(true);
      setSent(null);
      const payload = {
        name, email, phone, company, message,
        items: selectedIds.map((id) => ({ id, quantity: Math.max(1, quantities[id] || 1) })),
        postalCode,
        deliveryMethod,
        address: deliveryMethod === 'delivery' ? {
          line1: addr1,
          line2: addr2 || undefined,
          city,
          province,
          postalCode,
        } : undefined,
      };
      const res = await fetch('/api/send-list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const txt = await res.text();
        setSent({ ok: false, error: txt });
        return;
      }
      setSent({ ok: true });
      onSuccess();
    } catch (e: any) {
      setSent({ ok: false, error: e?.message || 'Erreur inconnue' });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-md border bg-white p-4 space-y-3">
      <div className="text-sm font-medium">Vos coordonnées</div>
      <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Nom complet" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Entreprise (optionnel)" value={company} onChange={(e) => setCompany(e.target.value)} />
      <textarea className="w-full rounded border px-3 py-2 text-sm" placeholder="Message (optionnel)" value={message} onChange={(e) => setMessage(e.target.value)} />
      <div className="text-sm font-medium">Livraison</div>
      <div className="flex items-center gap-3 text-sm">
        <label className="inline-flex items-center gap-2">
          <input type="radio" name="delivery" checked={deliveryMethod === 'pickup'} onChange={() => setDeliveryMethod('pickup')} />
          Ramassage en magasin
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="radio" name="delivery" checked={deliveryMethod === 'delivery'} onChange={() => setDeliveryMethod('delivery')} />
          Livraison à mon adresse
        </label>
      </div>
      {deliveryMethod === 'pickup' ? (
        <div className="text-xs text-gray-600">
          Retrait au: 940 Jean‑Neveu, Longueuil (Québec) J4G 2M1
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Adresse (ligne 1)" value={addr1} onChange={(e) => setAddr1(e.target.value)} required={deliveryMethod === 'delivery'} />
          <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Adresse (ligne 2)" value={addr2} onChange={(e) => setAddr2(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Ville" value={city} onChange={(e) => setCity(e.target.value)} required={deliveryMethod === 'delivery'} />
            <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Province" value={province} onChange={(e) => setProvince(e.target.value)} required={deliveryMethod === 'delivery'} />
          </div>
          <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Code postal (ex: H2X 1Y4)" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required={deliveryMethod === 'delivery'} />
        </div>
      )}
      {missing.length > 0 && (
        <div className="text-xs text-gray-600">
          Complétez: {missing.join(', ')}.
        </div>
      )}
      {sent?.ok === false && <div className="text-xs text-red-600">Envoi échoué: {sent.error}</div>}
      {sent?.ok === true && <div className="text-xs text-green-700">Votre liste a été envoyée avec succès.</div>}
      <button
        className="w-full rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        onClick={handleSend}
        disabled={!canSend}
      >
        {sending ? 'Envoi…' : 'Envoyer ma liste'}
      </button>
    </div>
  );
}


