export interface Tokens {
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    textPrimary: string;
    textMuted: string;
    brand: string;
    brandAlt: string;
    success: string;
    danger: string;
    shadow: string;
  };
  radius: { sm: number; md: number; lg: number };
  spacing: (n: number) => number;
  shadow: {
    card: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    subtle: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
  /** Optional, extended tokens for richer theming */
  typography?: {
    sizes: { xs: number; sm: number; md: number; lg: number; xl: number; '2xl': number };
    lineHeights: { tight: number; normal: number; relaxed: number };
    weights: { regular: string | number; medium: string | number; bold: string | number };
  };
  states?: {
    focus: string;
    pressed: string;
    hover: string;
    disabled: string;
  };
  elevations?: {
    level1: number;
    level2: number;
    level3: number;
  };
}

export const tokens: Tokens = {
  colors: {
    // Brand palette (light theme default)
    background: '#F3F6FA', // Slightly cooler gray for better contrast
    surface: '#FAFCFF',
    surfaceAlt: '#F9FBFF', // very light tint for layering
    border: '#E2E8F0', // slate-200
    textPrimary: '#0F172A', // slate-900
    textMuted: '#64748B', // slate-500
    brand: '#0A1F44', // Deep Navy (Primary)
    brandAlt: '#4FB3F6', // Sky Blue (Accent)
    success: '#22C55E',
    danger: '#EF4444',
    shadow: '#000000',
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
  spacing: (n: number) => n * 4,
  shadow: {
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3, // Cards: elevation 2–4
    },
    subtle: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
  },
  typography: {
    sizes: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24, '2xl': 32 },
    lineHeights: { tight: 1.1, normal: 1.3, relaxed: 1.5 },
    weights: { regular: '400', medium: '600', bold: '700' },
  },
  states: {
    focus: 'rgba(79, 179, 246, 0.5)',
    pressed: 'rgba(15, 23, 42, 0.08)',
    hover: 'rgba(15, 23, 42, 0.04)',
    disabled: 'rgba(100, 116, 139, 0.4)',
  },
  elevations: {
    level1: 1,
    level2: 3,
    level3: 6,
  },
} as const;

// Named interface above is the canonical Tokens type
