"use client";
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit() {
    setError(null);
    if (!email || !password || password !== confirm) { setError('Vérifiez vos informations.'); return; }
    const res = await fetch('/api/admin/invites/accept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, email, name, password }) });
    if (res.ok) {
      setOk(true);
      setTimeout(() => router.push('/admin/login'), 1500);
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j?.error || 'Erreur');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded border bg-white p-4">
        <h1 className="text-lg font-semibold mb-3">Accepter l’invitation</h1>
        <div className="space-y-2">
          <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Nom (optionnel)" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Confirmer le mot de passe" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error && <div className="text-xs text-red-600">{error}</div>}
          {ok && <div className="text-xs text-green-700">Compte créé. Redirection…</div>}
          <button className="w-full rounded bg-blue-600 text-white px-4 py-2 text-sm" onClick={submit}>Créer mon compte</button>
        </div>
      </div>
    </div>
  );
}


