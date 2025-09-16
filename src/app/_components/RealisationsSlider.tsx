"use client";
import { useEffect, useState } from 'react';

function Row({
  items,
  reverse = false,
  duration = 40,
  offset = 0,
  onItemClick,
}: {
  items: string[];
  reverse?: boolean;
  duration?: number;
  offset?: number;
  onItemClick?: (globalIndex: number) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const content = items.concat(items); // duplicate for seamless loop
  return (
    <div className="overflow-hidden">
      <div
        className={`flex gap-3 ${mounted ? (reverse ? 'animate-marquee-reverse' : 'animate-marquee') : ''}`}
        style={{ animationDuration: `${duration}s` }}
      >
        {content.map((src, idx) => {
          const localIndex = idx % items.length;
          const globalIndex = offset + localIndex;
          return (
            <div
              key={`${src}-${idx}`}
              className="h-32 sm:h-40 md:h-48 w-auto flex-shrink-0 rounded-md overflow-hidden border cursor-zoom-in"
              onClick={onItemClick ? () => onItemClick(globalIndex) : undefined}
              role={onItemClick ? 'button' : undefined}
              aria-label={onItemClick ? 'Voir en plein écran' : undefined}
            >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-auto object-cover" />
          </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RealisationsSlider() {
  const [items, setItems] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/realisations', { cache: 'no-store' });
        if (!res.ok) return;
        const j = await res.json();
        if (!cancelled) setItems(j.items || []);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (selectedIndex === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSelectedIndex(null);
      } else if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) => {
          if (prev === null) return prev;
          return (prev + 1) % items.length;
        });
      } else if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) => {
          if (prev === null) return prev;
          return (prev - 1 + items.length) % items.length;
        });
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedIndex, items.length]);

  if (!items.length) return null;
  const third = Math.ceil(items.length / 3);
  const r1 = items.slice(0, third);
  const r2 = items.slice(third, third * 2);
  const r3 = items.slice(third * 2);

  return (
    <section className="my-16">
      <div className="text-center mb-8">
        <h2 className="text-headline mb-2">Nos réalisations</h2>
      </div>
      <div className="space-y-4">
        <Row items={r1} reverse={false} duration={40} offset={0} onItemClick={(i) => setSelectedIndex(i)} />
        <Row items={r2} reverse duration={55} offset={r1.length} onItemClick={(i) => setSelectedIndex(i)} />
        <Row items={r3} reverse={false} duration={48} offset={r1.length + r2.length} onItemClick={(i) => setSelectedIndex(i)} />
      </div>

      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedIndex(null); }}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl"
            aria-label="Fermer"
          >
            ×
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedIndex((prev) => prev === null ? prev : (prev - 1 + items.length) % items.length); }}
            className="absolute left-3 sm:left-6 text-white/80 hover:text-white text-3xl select-none"
            aria-label="Précédent"
          >
            ‹
          </button>
          <div className="max-w-6xl max-h-[85vh] w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={items[selectedIndex]}
              alt=""
              className="max-h-[85vh] w-auto h-auto object-contain rounded-md shadow-2xl"
            />
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedIndex((prev) => prev === null ? prev : (prev + 1) % items.length); }}
            className="absolute right-3 sm:right-6 text-white/80 hover:text-white text-3xl select-none"
            aria-label="Suivant"
          >
            ›
          </button>
        </div>
      )}
    </section>
  );
}


