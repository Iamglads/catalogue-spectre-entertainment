"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Product = {
  _id: string;
  name: string;
  images?: string[];
  shortDescription?: string;
};

type ApiResponse = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: Product[];
};

export default function ForSaleSlider() {
  const [items, setItems] = useState<Product[]>([]);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = `/api/products?categoryPath=decors-a-vendre&page=1`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return;
        const j = (await res.json()) as ApiResponse;
        if (!cancelled) setItems((j.items || []).filter((p) => Array.isArray(p.images) && p.images[0]));
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  if (!items.length) return null;
  const display = items.slice(0, 10);

  function scrollBy(delta: number) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }

  return (
    <section className="my-16">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-headline">Décors à vendre</h2>
        <div className="flex items-center gap-3">
          <Link href="/decors-a-vendre" className="text-sm underline">Voir plus</Link>
          <button className="rounded border px-3 py-1.5 text-sm cursor-pointer" onClick={() => scrollBy(-((trackRef.current?.clientWidth || 0) * 0.9))} aria-label="Précédent">‹</button>
          <button className="rounded border px-3 py-1.5 text-sm cursor-pointer" onClick={() => scrollBy(((trackRef.current?.clientWidth || 0) * 0.9))} aria-label="Suivant">›</button>
        </div>
      </div>
      <div
        ref={trackRef}
        className="overflow-x-auto scroll-smooth"
      >
        <div className="flex gap-4 pr-2">
          {display.map((p) => {
            const image = p.images?.[0] || '';
            return (
              <div key={p._id} className="group relative flex-shrink-0 w-64 sm:w-72 md:w-80 lg:w-96">
                <div className="aspect-[4/3] overflow-hidden rounded-xl border bg-gray-50">
                  {image ? (
                    <Image src={image} alt={p.name} width={800} height={600} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-gray-400 bg-gray-100">Aucune image</div>
                  )}
                </div>
                <div className="mt-2">
                  <div className="text-sm font-medium text-gray-900 capitalize line-clamp-2">{p.name}</div>
                  {p.shortDescription && <div className="text-xs text-gray-600 line-clamp-1">{p.shortDescription}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


