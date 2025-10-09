"use client";

import { useTheme } from '@/contexts/ThemeContext';

/**
 * Animated moon for Halloween footer
 */
export default function MoonBackground() {
  const { currentTheme } = useTheme();

  if (currentTheme !== 'halloween') return null;

  return (
    <>
      {/* Full moon */}
      <div
        className="absolute top-8 right-12 pointer-events-none"
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #fff 0%, #f0f0f0 50%, #d0d0d0 100%)',
          boxShadow: '0 0 60px rgba(255, 255, 255, 0.8), 0 0 120px rgba(255, 255, 255, 0.4), inset -10px -10px 20px rgba(0, 0, 0, 0.1)',
          animation: 'moonGlow 4s ease-in-out infinite',
        }}
      >
        {/* Moon craters */}
        <div className="absolute top-6 left-8 w-6 h-6 rounded-full bg-gray-300 opacity-30" />
        <div className="absolute top-12 right-8 w-4 h-4 rounded-full bg-gray-300 opacity-20" />
        <div className="absolute bottom-8 left-12 w-5 h-5 rounded-full bg-gray-300 opacity-25" />
      </div>

      {/* Clouds passing in front of moon */}
      <div
        className="absolute top-0 right-0 pointer-events-none opacity-60"
        style={{
          width: '200px',
          height: '200px',
          animation: 'cloudDrift 20s linear infinite',
        }}
      >
        <div className="absolute top-16 left-0 w-32 h-8 rounded-full bg-gray-400 blur-sm" />
        <div className="absolute top-20 left-8 w-40 h-10 rounded-full bg-gray-500 blur-sm" />
      </div>

      <style jsx>{`
        @keyframes moonGlow {
          0%, 100% {
            box-shadow: 0 0 60px rgba(255, 255, 255, 0.8), 0 0 120px rgba(255, 255, 255, 0.4);
          }
          50% {
            box-shadow: 0 0 80px rgba(255, 255, 255, 1), 0 0 160px rgba(255, 255, 255, 0.6);
          }
        }

        @keyframes cloudDrift {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </>
  );
}







