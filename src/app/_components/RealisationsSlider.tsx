"use client";
import { useEffect, useState } from 'react';

function Row({ items, reverse = false, duration = 40 }: { items: string[]; reverse?: boolean; duration?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const content = items.concat(items); // duplicate for seamless loop
  return (
    <div className="overflow-hidden">
      <div
        className={`flex gap-3 ${mounted ? (reverse ? 'animate-marquee-reverse' : 'animate-marquee') : ''}`}
        style={{ animationDuration: `${duration}s` }}
      >
        {content.map((src, idx) => (
          <div key={`${src}-${idx}`} className="h-32 sm:h-40 md:h-48 w-auto flex-shrink-0 rounded-md overflow-hidden border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-auto object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RealisationsSlider() {
  const [items, setItems] = useState<string[]>([]);
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

  if (!items.length) return null;
  const third = Math.ceil(items.length / 3);
  const r1 = items.slice(0, third);
  const r2 = items.slice(third, third * 2);
  const r3 = items.slice(third * 2);

  return (
    <section className="my-10">
      <h2 className="mb-3 text-lg font-semibold">Réalisations</h2>
      <div className="space-y-3">
        <Row items={r1} reverse={false} duration={40} />
        <Row items={r2} reverse duration={55} />
        <Row items={r3} reverse={false} duration={48} />
      </div>
    </section>
  );
}


