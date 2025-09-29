"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

export default function HeroGallery() {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        // Reuse catalogue items: fetch a page of products and collect first images
        const res = await fetch('/api/products?page=1', { cache: 'no-store' });
        if (!res.ok) return;
        const j = await res.json() as { items?: Array<{ images?: string[] }> };
        const imgs = (j.items || [])
          .flatMap((p) => (Array.isArray(p.images) ? p.images : []))
          .filter(Boolean)
          .slice(0, 80);
        if (!canceled) setImages(imgs);
      } catch {}
    })();
    return () => { canceled = true; };
  }, []);

  const cols = useMemo(() => {
    const n = 5; // number of columns
    const arr: string[][] = Array.from({ length: n }, () => []);
    images.forEach((src, i) => { arr[i % n].push(src); });
    return arr;
  }, [images]);

  if (!images.length) return null;

  return (
    <section className="relative overflow-hidden w-full">
      <div className="absolute inset-0">
        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
        <div className="absolute inset-0 z-0">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 py-8 sm:py-12 lg:py-16">
              {cols.map((list, colIdx) => (
                <div key={colIdx} className="relative h-[260px] sm:h-[360px] lg:h-[520px] overflow-hidden rounded-lg">
                  <div
                    className={`${colIdx % 2 === 0 ? 'animate-marquee-y' : 'animate-marquee-y-reverse'}`}
                    style={{ animationDuration: `${48 + colIdx * 12}s`, animationDelay: `${colIdx * 2}s`, willChange: 'transform' }}
                    aria-hidden
                  >
                    <div className="flex flex-col gap-3">
                      {[...list, ...list].map((src, i) => (
                        <div key={`${src}-${i}`} className="relative w-full aspect-[4/3] rounded-md overflow-hidden border bg-gray-100">
                          <Image src={src} alt="" fill sizes="100vw" className="object-cover" priority />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-20 w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <h1 className="text-display text-white drop-shadow">Catalogue des décors</h1>
            <p className="mt-3 text-white/90">Explorez nos décors, mobilier et thématiques. Sélectionnez, demandez une soumission, ou découvrez nos décors à vendre.</p>
          </div>
        </div>
      </div>
    </section>
  );
}


