"use client";

import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useRef, useState } from 'react';

type ThemeHeroProps = {
  children?: React.ReactNode;
};

/**
 * Hero section with theme-aware background and optional particle effects
 */
export default function ThemeHero({ children }: ThemeHeroProps) {
  const { theme, currentTheme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Particle animation for themed backgrounds
  useEffect(() => {
    if (!mounted || theme.effects.particles === 'none') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system
    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
    };

    const particles: Particle[] = [];
    const particleCount = 30;

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: Math.random() * 0.5 + 0.3,
        size: Math.random() * 15 + 5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        opacity: Math.random() * 0.3 + 0.2,
      });
    }

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;

        // Draw based on particle type
        if (theme.effects.particles === 'autumn-leaves') {
          // Draw autumn leaf
          ctx.fillStyle = ['#FF6B35', '#FFB627', '#E85A2A', '#D97706'][Math.floor(Math.random() * 4)];
          ctx.beginPath();
          ctx.moveTo(0, -p.size / 2);
          ctx.bezierCurveTo(p.size / 2, -p.size / 4, p.size / 2, p.size / 4, 0, p.size / 2);
          ctx.bezierCurveTo(-p.size / 2, p.size / 4, -p.size / 2, -p.size / 4, 0, -p.size / 2);
          ctx.fill();
        } else if (theme.effects.particles === 'snowflakes') {
          // Draw snowflake
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          for (let i = 0; i < 6; i++) {
            ctx.rotate(Math.PI / 3);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, p.size);
            ctx.stroke();
          }
        } else if (theme.effects.particles === 'hearts') {
          // Draw heart
          ctx.fillStyle = '#E91E63';
          const s = p.size / 20;
          ctx.beginPath();
          ctx.moveTo(0, -5 * s);
          ctx.bezierCurveTo(10 * s, -15 * s, 20 * s, -5 * s, 0, 15 * s);
          ctx.bezierCurveTo(-20 * s, -5 * s, -10 * s, -15 * s, 0, -5 * s);
          ctx.fill();
        } else if (theme.effects.particles === 'sparkles') {
          // Draw sparkle
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const angle = (Math.PI / 4) * i;
            const radius = i % 2 === 0 ? p.size : p.size / 3;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();

        // Update particle position
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Wrap around screen
        if (p.y > canvas.height + p.size) {
          p.y = -p.size;
          p.x = Math.random() * canvas.width;
        }
        if (p.x > canvas.width + p.size) p.x = -p.size;
        if (p.x < -p.size) p.x = canvas.width + p.size;
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [theme.effects.particles, currentTheme, mounted]);

  // Prevent hydration mismatch by showing default on SSR
  if (!mounted) {
    return (
      <section className="w-full bg-[var(--muted)] border-b">
        <div className="section-padding mx-auto max-w-7xl py-12 sm:py-16 lg:py-20">
          {children}
        </div>
      </section>
    );
  }

  return (
    <section 
      className="relative w-full border-b overflow-hidden transition-all duration-500"
      style={{
        borderColor: 'var(--theme-border, #e5e7eb)',
        background: currentTheme === 'default' 
          ? 'var(--muted)' 
          : currentTheme === 'christmas'
          ? '#1dc5a3'
          : undefined,
      }}
    >
      {/* Background Image (if theme has one) */}
      {currentTheme !== 'default' && theme.colors.heroImage && (
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${theme.colors.heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}

      {/* Gradient overlay */}
      {currentTheme !== 'default' && currentTheme !== 'christmas' && (
        <div 
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background: theme.colors.backgroundGradient,
          }}
        />
      )}

      {/* Dark overlay for readability */}
      {currentTheme !== 'default' && currentTheme !== 'christmas' && (
        <div 
          className="absolute inset-0 pointer-events-none z-[2]"
          style={{
            background: theme.colors.heroOverlay,
          }}
        />
      )}

      {/* Particle canvas - on top as overlay */}
      {theme.effects.particles !== 'none' && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-[3]"
          style={{ width: '100%', height: '100%' }}
        />
      )}

      {/* Content - highest z-index */}
      <div className="relative section-padding mx-auto max-w-7xl py-12 sm:py-16 lg:py-20 z-[4]">
        <div style={{ color: currentTheme !== 'default' ? '#ffffff' : 'inherit' }}>
          {children}
        </div>
      </div>
    </section>
  );
}

