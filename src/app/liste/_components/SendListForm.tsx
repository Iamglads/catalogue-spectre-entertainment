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
  const [consent, setConsent] = useState(false);
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
  if (!consent) missing.push('consentement');
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
      // Reset form fields after successful send
      setName("");
      setEmail("");
      setPhone("");
      setCompany("");
      setMessage("");
      setPostalCode("");
      setDeliveryMethod("pickup");
      setAddr1("");
      setAddr2("");
      setCity("");
      setProvince("QC");
      onSuccess();
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'Erreur inconnue';
      setSent({ ok: false, error: errMsg });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="card p-6 space-y-6 sticky top-24">
      <div className="text-title">Demande de soumission</div>
      
      <div className="space-y-4">
        <div className="text-body font-medium">Vos coordonnées</div>
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Nom complet <span className="text-red-600">*</span></div>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required aria-required="true" />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Email <span className="text-red-600">*</span></div>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required aria-required="true" />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Téléphone <span className="text-red-600">*</span></div>
          <input type="tel" inputMode="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required aria-required="true" />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Entreprise (optionnel)</div>
          <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} />
        </label>
        <label className="text-sm">
          <div className="mb-1 text-gray-600">Message (optionnel)</div>
          <textarea className="input min-h-[80px] resize-none" value={message} onChange={(e) => setMessage(e.target.value)} />
        </label>
      </div>
      
      <div className="space-y-4">
        <div className="text-body font-medium">Livraison</div>
        <div className="flex items-center gap-4 text-sm">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input type="radio" name="delivery" checked={deliveryMethod === 'pickup'} onChange={() => setDeliveryMethod('pickup')} className="text-blue-600 cursor-pointer" />
          Ramassage
        </label>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input type="radio" name="delivery" checked={deliveryMethod === 'delivery'} onChange={() => setDeliveryMethod('delivery')} className="text-blue-600 cursor-pointer" />
          Livraison
        </label>
      </div>
      {deliveryMethod === 'pickup' ? (
        <div className="text-caption bg-blue-50 p-3 rounded-lg">
          Retrait au: 940 Jean‑Neveu, Longueuil (Québec) J4G 2M1
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          <label className="text-sm">
            <div className="mb-1 text-gray-600">Adresse (ligne 1) <span className="text-red-600">*</span></div>
            <input className="input" value={addr1} onChange={(e) => setAddr1(e.target.value)} required aria-required="true" />
          </label>
          <label className="text-sm">
            <div className="mb-1 text-gray-600">Adresse (ligne 2) (optionnel)</div>
            <input className="input" value={addr2} onChange={(e) => setAddr2(e.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">
              <div className="mb-1 text-gray-600">Ville <span className="text-red-600">*</span></div>
              <input className="input" value={city} onChange={(e) => setCity(e.target.value)} required aria-required="true" />
            </label>
            <label className="text-sm">
              <div className="mb-1 text-gray-600">Province <span className="text-red-600">*</span></div>
              <input className="input" value={province} onChange={(e) => setProvince(e.target.value)} required aria-required="true" />
            </label>
          </div>
          <label className="text-sm">
            <div className="mb-1 text-gray-600">Code postal <span className="text-red-600">*</span></div>
            <input className="input" placeholder="ex: H2X 1Y4" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required aria-required="true" />
          </label>
        </div>
      )}
      </div>

      {/* Consentement */}
      <div className="border-t pt-4">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-sm text-gray-700 leading-relaxed">
            Je consens à ce que mes informations soient utilisées pour traiter ma demande conformément à la{' '}
            <a
              href="https://spectre-entertainment.com/politique-de-confidentialite/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline font-medium"
            >
              Politique de confidentialité
            </a>{' '}
            du site. <span className="text-red-600">*</span>
          </span>
        </label>
      </div>
      
      {missing.length > 0 && (
        <div className="text-caption text-amber-600 bg-amber-50 p-3 rounded-lg">
          Complétez: {missing.join(', ')}.
        </div>
      )}
      {sent?.ok === false && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">Envoi échoué: {sent.error}</div>}
      {sent?.ok === true && <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">Votre liste a été envoyée.</div>}
      <button
        className="btn btn-primary w-full cursor-pointer disabled:cursor-not-allowed"
        onClick={handleSend}
        disabled={!canSend}
      >
        {sending ? 'Envoi…' : 'Envoyer ma liste'}
      </button>
    </div>
  );
}


