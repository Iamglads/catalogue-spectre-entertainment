"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { loadList } from '@/lib/listStorage';

export default function ListCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    try { setCount(loadList().length); } catch {}
    function onStorage(e: StorageEvent) {
      if (e.key === 'catalogue:list') {
        try { setCount(loadList().length); } catch {}
      }
    }
    function onCustom() {
      try { setCount(loadList().length); } catch {}
    }
    window.addEventListener('storage', onStorage);
    const customHandler = () => onCustom();
    window.addEventListener('catalogue:list:changed', customHandler as EventListener);
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('catalogue:list:changed', customHandler as EventListener); };
  }, []);

  return (
    <Link href="/liste" aria-label="Ma liste" className="relative inline-flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors">
      <Heart className="h-5 w-5 text-gray-600" />
      {count > 0 && (
      <span className="absolute -top-1 -right-1 rounded-full bg-red-500 text-white text-xs font-medium min-w-[18px] h-[18px] flex items-center justify-center">
        {count}
      </span>
      )}
    </Link>
  );
}


