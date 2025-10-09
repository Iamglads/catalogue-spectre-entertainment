"use client";

import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';

type ThemedH1Props = {
  children: React.ReactNode;
  className?: string;
};

/**
 * H1 component that properly applies theme fonts
 */
export default function ThemedH1({ children, className = '' }: ThemedH1Props) {
  const { theme, currentTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return <h1 className={className}>{children}</h1>;
  }

  return (
    <h1 
      className={className}
      style={{
        fontFamily: currentTheme === 'halloween' ? "'Creepster', cursive" : theme.fonts.heading,
        fontWeight: currentTheme === 'halloween' ? '400' : theme.fonts.headingWeight,
        lineHeight: '1.3',
        letterSpacing: currentTheme === 'halloween' ? '0.02em' : '-0.025em',
      }}
    >
      {children}
    </h1>
  );
}

