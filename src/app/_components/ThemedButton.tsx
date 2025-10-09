"use client";

import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';

type ThemedButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
};

/**
 * Button component that properly applies theme fonts (especially Creepster for Halloween)
 */
export default function ThemedButton({ 
  children, 
  onClick, 
  className = '', 
  type = 'button',
  disabled = false 
}: ThemedButtonProps) {
  const { theme, currentTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button type={type} onClick={onClick} className={className} disabled={disabled}>
        {children}
      </button>
    );
  }

  return (
    <button 
      type={type}
      onClick={onClick}
      className={className}
      disabled={disabled}
      style={{
        fontFamily: currentTheme === 'halloween' ? "'Creepster', cursive" : theme.fonts.heading,
        fontWeight: currentTheme === 'halloween' ? '400' : theme.fonts.headingWeight,
        letterSpacing: currentTheme === 'halloween' ? '0.05em' : 'normal',
      }}
    >
      {children}
    </button>
  );
}







