"use client";

import { useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Spider web effect for Halloween theme header
 */
export default function SpiderWeb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentTheme } = useTheme();

  useEffect(() => {
    // Only show spider web for Halloween theme
    if (currentTheme !== 'halloween') return;

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

    // Draw spider web
    const drawWeb = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Web origin (top right corner)
      const originX = canvas.width - 20;
      const originY = 20;
      
      // Draw radial lines
      const numRadials = 8;
      const maxLength = Math.min(canvas.width, 150);
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      
      // Draw radial spokes
      for (let i = 0; i < numRadials; i++) {
        const angle = (Math.PI / 2) + (i * Math.PI / (numRadials * 1.5));
        const endX = originX + Math.cos(angle) * maxLength;
        const endY = originY + Math.sin(angle) * maxLength;
        
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
      
      // Draw concentric circles
      const numCircles = 6;
      for (let i = 1; i <= numCircles; i++) {
        const radius = (maxLength / numCircles) * i;
        
        ctx.beginPath();
        for (let j = 0; j < numRadials; j++) {
          const angle = (Math.PI / 2) + (j * Math.PI / (numRadials * 1.5));
          const x = originX + Math.cos(angle) * radius;
          const y = originY + Math.sin(angle) * radius;
          
          if (j === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
      
      // Draw spider
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.arc(originX - 30, originY + 25, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Spider legs
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const legLength = 8;
        ctx.beginPath();
        ctx.moveTo(originX - 30, originY + 25);
        ctx.lineTo(
          originX - 30 + Math.cos(angle) * legLength,
          originY + 25 + Math.sin(angle) * legLength
        );
        ctx.stroke();
      }
    };

    drawWeb();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [currentTheme]);

  // Only render for Halloween theme
  if (currentTheme !== 'halloween') {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ 
        width: '100%', 
        height: '100%',
        mixBlendMode: 'overlay',
      }}
    />
  );
}







