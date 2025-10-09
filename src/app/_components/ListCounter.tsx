"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { loadList } from '@/lib/listStorage';
import { useTheme } from '@/contexts/ThemeContext';

export default function ListCounter() {
  const [count, setCount] = useState(0);
  const { currentTheme } = useTheme();

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
    <Link 
      href="/liste" 
      aria-label="Ma liste" 
      className="relative inline-flex items-center justify-center p-2 rounded-lg transition-all"
      style={{
        backgroundColor: currentTheme === 'halloween' ? 'rgba(255, 107, 53, 0.15)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = currentTheme === 'halloween' 
          ? 'rgba(255, 107, 53, 0.25)' 
          : 'rgba(0, 0, 0, 0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = currentTheme === 'halloween' 
          ? 'rgba(255, 107, 53, 0.15)' 
          : 'transparent';
      }}
    >
      <Heart 
        className="h-5 w-5 transition-all" 
        style={{ 
          color: currentTheme === 'halloween' ? '#FFB627' : 'var(--theme-text, #4b5563)',
          filter: currentTheme === 'halloween' ? 'drop-shadow(0 0 8px rgba(255, 182, 39, 0.6))' : 'none',
        }} 
      />
      {count > 0 && (
      <span 
        className="absolute -top-1 -right-1 rounded-full text-white text-xs font-medium min-w-[18px] h-[18px] flex items-center justify-center animate-pulse"
        style={{ 
          backgroundColor: 'var(--theme-primary, #ef4444)',
          boxShadow: currentTheme === 'halloween' 
            ? '0 0 20px rgba(255, 107, 53, 0.8), 0 4px 6px rgba(0, 0, 0, 0.2)' 
            : 'var(--theme-button-shadow, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
          fontFamily: currentTheme === 'halloween' ? "'Creepster', cursive" : 'inherit',
        }}
      >
        {count}
      </span>
      )}
    </Link>
  );
}


