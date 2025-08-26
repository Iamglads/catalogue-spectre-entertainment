"use client";
import Link from "next/link";

export default function AdminHomePage() {
  const cards = [
    { href: "/admin/quotes", title: "Soumissions", desc: "Voir et gérer les demandes de soumission" },
    { href: "/admin/products", title: "Produits", desc: "Lister, créer et éditer les produits" },
    { href: "/admin/categories", title: "Catégories", desc: "Gérer la hiérarchie des catégories" },
  ];
  return (
    <div className="min-h-screen py-6 mx-auto w-full max-w-5xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Administration</h1>
        <Link href="/" className="text-sm underline">← Retour au site</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="rounded border bg-white p-4 hover:bg-gray-50">
            <div className="text-lg font-semibold">{c.title}</div>
            <div className="mt-1 text-sm text-gray-600">{c.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}


