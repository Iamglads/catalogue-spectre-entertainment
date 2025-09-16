"use client";
import Link from "next/link";

export default function AdminHomePage() {
  const cards = [
    { 
      href: "/admin/quotes", 
      title: "Soumissions", 
      desc: "Voir et gérer les demandes de soumission",
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100"
    },
    { 
      href: "/admin/products", 
      title: "Produits", 
      desc: "Lister, créer et éditer les produits",
      color: "bg-green-50 border-green-200 hover:bg-green-100"
    },
    { 
      href: "/admin/categories", 
      title: "Catégories", 
      desc: "Gérer la hiérarchie des catégories",
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100"
    },
    {
      href: "/admin/invites",
      title: "Invitations",
      desc: "Inviter un collaborateur (rôle utilisateur)",
      color: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
    },
  ];
  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8 mx-auto w-full max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Administration</h1>
        <Link href="/" className="text-sm underline">← Retour au site</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className={`rounded-xl border p-6 transition-all hover:shadow-md ${c.color}`}>
            <div className="text-lg font-semibold">{c.title}</div>
            <div className="mt-1 text-sm text-gray-600">{c.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}




