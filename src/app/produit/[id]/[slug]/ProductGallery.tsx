"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  images: string[];
  name: string;
};

export default function ProductGallery({ images, name }: Props) {
  const [index, setIndex] = useState(0);
  const hasImages = Array.isArray(images) && images.length > 0;
  const current = hasImages ? images[Math.max(0, Math.min(index, images.length - 1))] : undefined;
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!hasImages) return;
      if (e.key === "ArrowLeft") setIndex((i) => (i > 0 ? i - 1 : images.length - 1));
      else if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasImages, images.length]);

  return (
    <div ref={containerRef} className="w-full">
      <div className="relative w-full bg-gray-50 flex items-center justify-center rounded-xl overflow-hidden border">
        {hasImages ? (
          <div className="relative w-full aspect-[4/3]">
            <Image src={current!} alt={name} fill sizes="100vw" className="object-contain" />
          </div>
        ) : (
          <div className="w-full aspect-[4/3] flex items-center justify-center text-sm text-gray-400 bg-gray-100">Aucune image</div>
        )}

        {hasImages && images.length > 1 && (
          <>
            <button
              aria-label="Précédente"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg hover:bg-white hover:shadow-xl transition-all cursor-pointer"
              onClick={() => setIndex((i) => (i > 0 ? i - 1 : images.length - 1))}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              aria-label="Suivante"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg hover:bg-white hover:shadow-xl transition-all cursor-pointer"
              onClick={() => setIndex((i) => (i + 1) % images.length)}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {hasImages && images.length > 1 && (
        <div className="mt-4 grid grid-flow-col auto-cols-[96px] gap-2 overflow-x-auto pb-1">
          {images.map((src, idx) => (
            <button
              key={`${src}-${idx}`}
              className={`relative h-20 w-24 flex-shrink-0 rounded-lg border-2 ${idx === index ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'} overflow-hidden transition-all`}
              onClick={() => setIndex(idx)}
              aria-label={`Image ${idx + 1}`}
              title={`Image ${idx + 1}`}
            >
              <Image src={src} alt="" width={96} height={80} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}











