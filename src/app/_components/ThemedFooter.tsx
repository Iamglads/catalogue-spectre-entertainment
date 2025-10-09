"use client";

import { useTheme } from '@/contexts/ThemeContext';
import MoonBackground from './MoonBackground';

export default function ThemedFooter() {
  const { theme, currentTheme } = useTheme();

  return (
    <footer 
      className="border-t backdrop-blur-sm transition-all duration-500 relative overflow-hidden mt-auto"
      style={{
        background: currentTheme === 'halloween' 
          ? theme.colors.footerBg 
          : 'rgba(255, 255, 255, 0.8)',
        borderColor: 'var(--theme-border, #e5e7eb)',
        boxShadow: currentTheme === 'halloween' 
          ? '0 -4px 20px rgba(106, 5, 114, 0.3)' 
          : 'none',
      }}
    >
      {/* Halloween graveyard decoration */}
      {currentTheme === 'halloween' && (
        <>
          {/* Moon */}
          <MoonBackground />
          
          {/* Fog effect */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(106, 5, 114, 0.4) 0%, transparent 70%)',
              animation: 'fogMove 10s ease-in-out infinite',
            }}
          />
          
          {/* Tombstones decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none opacity-20">
            <div className="container-max section-padding flex justify-around items-end h-full">
              <span className="text-4xl">🪦</span>
              <span className="text-3xl">🪦</span>
              <span className="text-4xl">🪦</span>
              <span className="text-3xl hidden sm:block">🪦</span>
              <span className="text-4xl hidden md:block">🪦</span>
            </div>
          </div>
        </>
      )}

      <div 
        className="container-max section-padding py-8 text-center text-sm space-y-2 relative z-10" 
        style={{ 
          color: currentTheme === 'halloween' ? 'rgba(255, 255, 255, 0.9)' : 'var(--theme-text-muted, #6b7280)' 
        }}
      >
        <div>
          <span style={{ 
            fontFamily: currentTheme === 'halloween' ? "'Creepster', cursive" : 'inherit',
            fontSize: currentTheme === 'halloween' ? '1.1rem' : 'inherit',
            letterSpacing: currentTheme === 'halloween' ? '0.05em' : 'normal',
          }}>
            Spectre Entertainment
          </span>
          {' - Tous droits réservés · '}
          <a
            href="https://spectre-entertainment.com/politique-de-confidentialite/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline transition-colors"
            style={{ 
              color: 'var(--theme-primary, #3b82f6)',
              textShadow: currentTheme === 'halloween' ? '0 0 10px rgba(255, 107, 53, 0.5)' : 'none',
            }}
          >
            Politique de confidentialité
          </a>
        </div>
        <div style={{ opacity: 0.7 }}>940 Jean‑Neveu, Longueuil (Québec) J4G 2M1</div>
        
       
      </div>
    </footer>
  );
}

