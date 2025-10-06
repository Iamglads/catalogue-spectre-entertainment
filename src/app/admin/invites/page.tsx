"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, UserPlus, Copy, Check, Trash2, AlertCircle, Users, Shield, ChevronLeft, Loader2 } from "lucide-react";

export default function AdminInvitesPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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
      setEmail("");
      setName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  const copyLink = () => {
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <Link href="/admin" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 group">
          <ChevronLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
          Retour au tableau de bord
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            Invitations
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form section */}
          <div className="lg:col-span-1">
            <div className="card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                Nouvelle invitation
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de l'invité
                </label>
                <input
                  className="input w-full"
                  placeholder="admin@exemple.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom (optionnel)
                </label>
                <input
                  className="input w-full"
                  placeholder="Jean Dupont"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              )}

              {link && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="text-sm text-green-800 font-medium">
                      Invitation créée avec succès !
                    </div>
                  </div>
                  <div className="bg-white rounded border border-green-300 p-3">
                    <div className="text-xs text-gray-600 mb-1">Lien d'invitation :</div>
                    <div className="text-xs text-gray-900 break-all mb-2">{link}</div>
                    <button
                      onClick={copyLink}
                      className="btn btn-ghost btn-sm w-full justify-center"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Copié !
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copier le lien
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <button
                className="btn btn-primary w-full justify-center disabled:cursor-not-allowed"
                onClick={createInvite}
                disabled={loading || !email}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création…
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Créer l'invitation
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Users table section */}
          <div className="lg:col-span-2">
            <UsersTable />
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersTable() {
  const [rows, setRows] = useState<Array<{ _id: string; email: string; name?: string; role: 'admin' | 'user' }>>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Erreur');
      setRows(j.items || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
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
    if (!confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(j?.error || 'Impossible de supprimer');
      } else {
        await load();
      }
    } finally {
      setDeletingId(null);
    }
  }

  const getRoleBadge = (role: 'admin' | 'user') => {
    if (role === 'admin') {
      return 'bg-purple-100 text-purple-700 border-purple-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="card">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          Utilisateurs 
        </h2>
      </div>

      {loading ? (
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : err ? (
        <div className="p-4 flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          {err}
        </div>
      ) : rows.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <div className="text-sm">Aucun utilisateur</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Rôle</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900 truncate">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      className="input w-full max-w-xs text-sm"
                      defaultValue={u.name || ''}
                      onBlur={(e) => setName(u._id, e.target.value)}
                      placeholder="Ajouter un nom"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <select
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getRoleBadge(u.role)} cursor-pointer`}
                        value={u.role}
                        onChange={(e) => setRole(u._id, e.target.value as 'admin' | 'user')}
                      >
                        <option value="admin">Admin</option>
                        <option value="user">Utilisateur</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => remove(u._id)}
                      disabled={deletingId === u._id}
                    >
                      {deletingId === u._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
