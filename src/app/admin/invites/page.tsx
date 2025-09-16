"use client";
import { useEffect, useState } from "react";

export default function AdminInvitesPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Array<{ _id: string; email: string; name?: string; role: 'admin' | 'user' }>>([]);

  async function createInvite() {
    setLoading(true);
    setError(null);
    setLink(null);
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Erreur");
      setLink(j.url as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8 mx-auto w-full max-w-6xl">
      <div className="mb-4"><a href="/admin" className="text-sm underline">← Retour</a></div>
      <h1 className="text-2xl font-semibold mb-4">Invitations</h1>
      <div className="rounded border bg-white p-4 max-w-lg">
        <div className="grid gap-3">
          <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Email de l’invité" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full rounded border px-3 py-2 text-sm" placeholder="Nom (optionnel)" value={name} onChange={(e) => setName(e.target.value)} />
          {error && <div className="text-xs text-red-600">{error}</div>}
          {link && (
            <div className="text-xs text-green-700 break-all">
              Lien créé: <a className="underline" href={link} target="_blank" rel="noreferrer">{link}</a>
            </div>
          )}
          <button className="rounded bg-blue-600 text-white px-4 py-2 text-sm disabled:opacity-50" onClick={createInvite} disabled={loading || !email}>
            {loading ? "Création…" : "Envoyer l’invitation"}
          </button>
        </div>
      </div>

      <div className="mt-8">
        <div className="text-lg font-semibold mb-2">Utilisateurs</div>
        <UsersTable />
      </div>
    </div>
  );
}

function UsersTable() {
  const [rows, setRows] = useState<Array<{ _id: string; email: string; name?: string; role: 'admin' | 'user' }>>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const res = await fetch('/api/admin/users');
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Erreur');
      setRows(j.items || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur');
    }
  }

  useEffect(() => { load(); }, []);

  async function setRole(id: string, role: 'admin' | 'user') {
    await fetch(`/api/admin/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    await load();
  }
  async function setName(id: string, name: string) {
    await fetch(`/api/admin/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
  }
  async function remove(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j?.error || 'Impossible de supprimer');
    }
    await load();
  }

  return (
    <div className="rounded border bg-white">
      <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b text-xs font-semibold text-gray-600">
        <div className="col-span-4">Email</div>
        <div className="col-span-3">Nom</div>
        <div className="col-span-3">Rôle</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>
      {rows.map((u) => (
        <div key={u._id} className="grid grid-cols-12 gap-2 items-center px-3 py-2 border-b text-sm">
          <div className="col-span-4 truncate">{u.email}</div>
          <div className="col-span-3">
            <input className="w-full rounded border px-2 py-1 text-sm" defaultValue={u.name || ''} onBlur={(e) => setName(u._id, e.target.value)} />
          </div>
          <div className="col-span-3">
            <select className="rounded border px-2 py-1 text-sm" value={u.role} onChange={(e) => setRole(u._id, e.target.value as 'admin' | 'user')}>
              <option value="admin">admin</option>
              <option value="user">user</option>
            </select>
          </div>
          <div className="col-span-2 text-right">
            <button className="rounded border px-2 py-1 text-sm text-red-600" onClick={() => remove(u._id)}>Supprimer</button>
          </div>
        </div>
      ))}
      {err && <div className="p-3 text-xs text-red-600">{err}</div>}
      {rows.length === 0 && !err && <div className="p-3 text-sm text-gray-500">Aucun utilisateur</div>}
    </div>
  );
}
