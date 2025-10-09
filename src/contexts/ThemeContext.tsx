"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ThemeName, themes, getActiveTheme, generateThemeCSSVariables, getThemeFontURLs } from '@/lib/themes';

type ThemeContextType = {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  theme: typeof themes[ThemeName];
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('default');
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    // Priority: ENV variable > localStorage
    const envTheme = process.env.NEXT_PUBLIC_ACTIVE_THEME as ThemeName;
    const storedTheme = localStorage.getItem('catalogue:theme') as ThemeName;
    
    // Use env theme if set, otherwise use stored or default
    const activeTheme = (envTheme && envTheme in themes) 
      ? envTheme 
      : (storedTheme && storedTheme in themes) 
        ? storedTheme 
        : 'default';
    
    setCurrentTheme(activeTheme);
    setMounted(true);
  }, []);

  // Apply theme CSS variables and load fonts
  useEffect(() => {
    if (!mounted) return;

    const theme = themes[currentTheme];
    const cssVars = generateThemeCSSVariables(currentTheme);

    // Apply CSS variables to :root with priority
    const root = document.documentElement;
    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value, 'important');
    });

    // Add data-theme attribute for potential CSS selectors
    root.setAttribute('data-theme', currentTheme);
    
    // Force reflow to apply font changes immediately
    document.body.offsetHeight;

    // Load Google Fonts dynamically
    const fontURLs = getThemeFontURLs(currentTheme);
    const existingLinks = Array.from(document.querySelectorAll('link[data-theme-font]'));
    
    // Remove old font links
    existingLinks.forEach(link => link.remove());

    // Add new font links with preload for better performance
    fontURLs.forEach(url => {
      // Preconnect to Google Fonts
      if (!document.querySelector('link[href="https://fonts.googleapis.com"]')) {
        const preconnect1 = document.createElement('link');
        preconnect1.rel = 'preconnect';
        preconnect1.href = 'https://fonts.googleapis.com';
        document.head.appendChild(preconnect1);
        
        const preconnect2 = document.createElement('link');
        preconnect2.rel = 'preconnect';
        preconnect2.href = 'https://fonts.gstatic.com';
        preconnect2.crossOrigin = 'anonymous';
        document.head.appendChild(preconnect2);
      }
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.setAttribute('data-theme-font', 'true');
      document.head.appendChild(link);
    });

    // Store in localStorage
    try {
      localStorage.setItem('catalogue:theme', currentTheme);
    } catch (e) {
      console.warn('Failed to store theme in localStorage', e);
    }
  }, [currentTheme, mounted]);

  const setTheme = useCallback((theme: ThemeName) => {
    setCurrentTheme(theme);
  }, []);

  const value: ThemeContextType = {
    currentTheme,
    setTheme,
    theme: themes[currentTheme],
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return <>{children}</>;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return default theme instead of throwing error (for SSR compatibility)
    return {
      currentTheme: 'default' as ThemeName,
      setTheme: () => {},
      theme: themes['default'],
    };
  }
  return context;
}

