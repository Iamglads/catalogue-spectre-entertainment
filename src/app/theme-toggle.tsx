"use client";
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
      if (saved === 'dark' || saved === 'light') setTheme(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('theme', theme); } catch {}
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <button
      className="inline-flex items-center justify-center rounded border p-2 hover:bg-gray-50"
      onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
      aria-label={theme === 'light' ? 'Activer le thème sombre' : 'Activer le thème clair'}
      title={theme === 'light' ? 'Activer le thème sombre' : 'Activer le thème clair'}
    >
      {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}


