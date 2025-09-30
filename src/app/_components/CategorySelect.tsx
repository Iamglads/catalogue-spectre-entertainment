"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

export type CatItem = { _id: string; label: string; fullPath: string };

type Props = {
  categories: CatItem[];
  value?: string;
  onChange: (id: string) => void;
  placeholder?: string;
};

export default function CategorySelect({ categories, value, onChange, placeholder = "Catégorie…" }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  function sanitizeCategoryText(text?: string): string {
    return (text || '').replace(/\\+/g, '').trim();
  }

  const selected = useMemo(() => categories.find((c) => c._id === value) || null, [categories, value]);
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories.slice(0, 200);
    return categories.filter((c) => sanitizeCategoryText(c.label).toLowerCase().includes(q)).slice(0, 200);
  }, [categories, query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div ref={containerRef} className="relative min-w-[260px]">
      <button
        type="button"
        className="btn btn-secondary w-full justify-between"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">
          {selected ? sanitizeCategoryText(selected.label) : <span className="text-gray-400">{placeholder}</span>}
        </span>
        {selected && (
          <span
            className="ml-auto inline-flex items-center justify-center rounded-full p-1 hover:bg-gray-200 transition-colors"
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            aria-label="Effacer le filtre"
            title="Effacer"
          >
            <X className="h-4 w-4" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border bg-white text-gray-900 shadow-xl animate-fade-in">
          <div className="p-3 border-b">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher…"
              className="input text-sm"
            />
          </div>
          <ul role="listbox" className="max-h-64 overflow-auto py-2">
            {items.map((c) => (
              <li key={c._id}>
                <button
                  role="option"
                  aria-selected={value === c._id}
                  onClick={() => { onChange(c._id); setOpen(false); setQuery(""); }}
                  className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${value === c._id ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                >
              {sanitizeCategoryText(c.label)}
                </button>
              </li>
            ))}
            {items.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-500">Aucun résultat</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}


