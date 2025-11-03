/**
 * Système de thèmes saisonniers pour Catalogue Spectre
 * Permet de basculer entre différents thèmes (Halloween, Noël, etc.)
 */

export type ThemeName = 'default' | 'halloween' | 'christmas' | 'valentine' | 'summer';

export type ThemeColors = {
  primary: string;
  primaryHover: string;
  secondary: string;
  accent: string;
  background: string;
  backgroundGradient: string;
  text: string;
  textMuted: string;
  border: string;
  cardBg: string;
  heroOverlay: string;
  heroImage?: string; // Optional background image for hero
  headerBg?: string; // Optional header background
  footerBg?: string; // Optional footer background
};

export type ThemeFonts = {
  heading: string; // Pour H1, H2
  headingWeight: string;
  body: string;
  bodyWeight: string;
};

export type ThemeEffects = {
  glow: boolean; // Effet glow sur boutons
  glowColor: string;
  particles: 'none' | 'autumn-leaves' | 'snowflakes' | 'hearts' | 'sparkles';
  buttonShadow: string;
  cardShadow: string;
  hoverTransform: string;
};

export type Theme = {
  name: ThemeName;
  label: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  effects: ThemeEffects;
  active: boolean;
};

/**
 * Configuration des thèmes
 */
export const themes: Record<ThemeName, Omit<Theme, 'active'>> = {
  default: {
    name: 'default',
    label: 'Classique',
    colors: {
      primary: '#0c71c3',
      primaryHover: '#0a5fa3',
      secondary: '#6b7280',
      accent: '#3b82f6',
      background: '#ffffff',
      backgroundGradient: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
      text: '#111827',
      textMuted: '#6b7280',
      border: '#e5e7eb',
      cardBg: '#ffffff',
      heroOverlay: 'rgba(0, 0, 0, 0.4)',
    },
    fonts: {
      heading: 'var(--font-heading)', // Orbitron
      headingWeight: '700',
      body: 'var(--font-geist-sans)',
      bodyWeight: '400',
    },
    effects: {
      glow: false,
      glowColor: 'transparent',
      particles: 'none',
      buttonShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      cardShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      hoverTransform: 'translateY(-2px)',
    },
  },
  halloween: {
    name: 'halloween',
    label: 'Halloween 🎃',
    colors: {
      primary: '#FF6B35', // Orange Halloween
      primaryHover: '#E85A2A',
      secondary: '#6A0572', // Violet mystique
      accent: '#FFB627', // Or automnal
      background: '#ffffff', // Fond blanc normal
      backgroundGradient: 'linear-gradient(135deg, rgba(45, 27, 27, 0.3) 0%, rgba(26, 26, 26, 0.4) 50%, rgba(31, 15, 46, 0.3) 100%)', // Gradient léger
      text: '#111827', // Texte normal
      textMuted: '#6b7280',
      border: '#FF6B35', // Bordures orange
      cardBg: '#ffffff', // Cards blanches normales
      heroOverlay: 'rgba(0, 0, 0, 0.2)', // Overlay très léger pour voir l'image
      heroImage: '/theme-images/halloween.png', // Image de fond Halloween
      headerBg: 'linear-gradient(180deg, rgba(0, 0, 0, 0.98) 0%, rgba(20, 10, 10, 0.95) 100%)', // Header très sombre Halloween
      footerBg: 'linear-gradient(0deg, rgba(0, 0, 0, 0.98) 0%, rgba(15, 5, 20, 0.95) 100%)', // Footer très sombre violet
    },
    fonts: {
      heading: 'Creepster, cursive', // Font Halloween avec fallback
      headingWeight: '400',
      body: 'var(--font-geist-sans)',
      bodyWeight: '400',
    },
    effects: {
      glow: true,
      glowColor: '#FF6B35',
      particles: 'autumn-leaves',
      buttonShadow: '0 0 20px rgba(255, 107, 53, 0.4), 0 4px 6px rgba(0, 0, 0, 0.2)',
      cardShadow: '0 4px 12px rgba(106, 5, 114, 0.3)',
      hoverTransform: 'translateY(-4px) scale(1.02)',
    },
  },
  christmas: {
    name: 'christmas',
    label: 'Noël 🎄',
    colors: {
      primary: '#f81d3d', // Rouge marqué
      primaryHover: '#d61433',
      secondary: '#1dc5a3', // Vert/cyan marqué
      accent: '#1dc5a3', // Accent vert
      background: '#ffffff',
      backgroundGradient: 'linear-gradient(135deg, rgba(248, 249, 250, 0.9) 0%, rgba(29, 197, 163, 0.1) 50%, rgba(248, 29, 61, 0.1) 100%)',
      text: '#1a1a1a',
      textMuted: '#5f6368',
      border: '#f81d3d',
      cardBg: '#ffffff',
      heroOverlay: 'rgba(0, 0, 0, 0.2)',
      heroImage: '/theme-images/christmas.jpg', // Placeholder - à ajouter
    },
    fonts: {
      heading: "'Fredoka One', cursive",
      headingWeight: '700',
      body: 'var(--font-geist-sans)',
      bodyWeight: '400',
    },
    effects: {
      glow: true,
      glowColor: '#1dc5a3',
      particles: 'snowflakes',
      buttonShadow: '0 0 15px rgba(248, 29, 61, 0.4), 0 4px 6px rgba(0, 0, 0, 0.1)',
      cardShadow: '0 4px 12px rgba(29, 197, 163, 0.2)',
      hoverTransform: 'translateY(-3px)',
    },
  },
  valentine: {
    name: 'valentine',
    label: 'Saint-Valentin 💝',
    colors: {
      primary: '#E91E63', // Rose
      primaryHover: '#C2185B',
      secondary: '#F06292',
      accent: '#FF4081',
      background: '#ffffff',
      backgroundGradient: 'linear-gradient(135deg, #fce4ec 0%, #ffffff 50%, #fff0f5 100%)',
      text: '#1a1a1a',
      textMuted: '#757575',
      border: '#F48FB1',
      cardBg: '#ffffff',
      heroOverlay: 'rgba(233, 30, 99, 0.2)',
    },
    fonts: {
      heading: "'Pacifico', cursive",
      headingWeight: '400',
      body: 'var(--font-geist-sans)',
      bodyWeight: '400',
    },
    effects: {
      glow: true,
      glowColor: '#FF4081',
      particles: 'hearts',
      buttonShadow: '0 0 15px rgba(233, 30, 99, 0.3), 0 4px 6px rgba(0, 0, 0, 0.1)',
      cardShadow: '0 4px 12px rgba(244, 143, 177, 0.2)',
      hoverTransform: 'translateY(-2px) rotate(-1deg)',
    },
  },
  summer: {
    name: 'summer',
    label: 'Été ☀️',
    colors: {
      primary: '#FFA726', // Orange soleil
      primaryHover: '#FB8C00',
      secondary: '#42A5F5', // Bleu ciel
      accent: '#FFEB3B', // Jaune vif
      background: '#ffffff',
      backgroundGradient: 'linear-gradient(135deg, #fff9e6 0%, #e3f2fd 50%, #ffffff 100%)',
      text: '#1a1a1a',
      textMuted: '#616161',
      border: '#FFA726',
      cardBg: '#ffffff',
      heroOverlay: 'rgba(255, 167, 38, 0.15)',
    },
    fonts: {
      heading: "'Fredoka One', cursive",
      headingWeight: '400',
      body: 'var(--font-geist-sans)',
      bodyWeight: '400',
    },
    effects: {
      glow: true,
      glowColor: '#FFEB3B',
      particles: 'sparkles',
      buttonShadow: '0 0 15px rgba(255, 167, 38, 0.3), 0 4px 6px rgba(0, 0, 0, 0.1)',
      cardShadow: '0 4px 12px rgba(255, 235, 59, 0.15)',
      hoverTransform: 'translateY(-3px) scale(1.02)',
    },
  },
};

/**
 * Récupère le thème actif depuis les variables d'environnement
 * ou retourne le thème par défaut
 */
export function getActiveTheme(): ThemeName {
  // Check environment variable FIRST (priority)
  const envTheme = process.env.NEXT_PUBLIC_ACTIVE_THEME as ThemeName;
  if (envTheme && envTheme in themes) {
    return envTheme;
  }
  
  if (typeof window !== 'undefined') {
    // Client-side: check localStorage (can override env theme)
    const stored = localStorage.getItem('catalogue:theme');
    if (stored && stored in themes) {
      return stored as ThemeName;
    }
  }
  
  return 'default';
}

/**
 * Génère les CSS variables pour un thème donné
 */
export function generateThemeCSSVariables(themeName: ThemeName): Record<string, string> {
  const theme = themes[themeName];
  return {
    '--theme-primary': theme.colors.primary,
    '--theme-primary-hover': theme.colors.primaryHover,
    '--theme-secondary': theme.colors.secondary,
    '--theme-accent': theme.colors.accent,
    '--theme-background': theme.colors.background,
    '--theme-background-gradient': theme.colors.backgroundGradient,
    '--theme-text': theme.colors.text,
    '--theme-text-muted': theme.colors.textMuted,
    '--theme-border': theme.colors.border,
    '--theme-card-bg': theme.colors.cardBg,
    '--theme-hero-overlay': theme.colors.heroOverlay,
    '--theme-heading-font': theme.fonts.heading,
    '--theme-heading-weight': theme.fonts.headingWeight,
    '--theme-body-font': theme.fonts.body,
    '--theme-body-weight': theme.fonts.bodyWeight,
    '--theme-glow-color': theme.effects.glowColor,
    '--theme-button-shadow': theme.effects.buttonShadow,
    '--theme-card-shadow': theme.effects.cardShadow,
  };
}

/**
 * Retourne les URLs Google Fonts nécessaires pour un thème
 */
export function getThemeFontURLs(themeName: ThemeName): string[] {
  const urls: string[] = [];
  
  switch (themeName) {
    case 'halloween':
      urls.push('https://fonts.googleapis.com/css2?family=Creepster&display=swap');
      break;
    case 'christmas':
      urls.push('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');
      break;
    case 'valentine':
      urls.push('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');
      break;
    case 'summer':
      urls.push('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');
      break;
  }
  
  return urls;
}

