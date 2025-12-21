export interface Tokens {
  colors: {
    // Backgrounds
    background: string;
    surface: string;
    surfaceAlt: string;
    surfaceGlass: string;
    // Borders
    border: string;
    borderAccent: string;
    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    // Brand
    brand: string;
    brandAlt: string;
    brandGlow: string;
    // Semantic
    success: string;
    successGlow: string;
    warning: string;
    danger: string;
    dangerGlow: string;
    // Gradients
    gradientStart: string;
    gradientMid: string;
    gradientEnd: string;
    // Shadow
    shadow: string;
    glowPrimary: string;
    glowSecondary: string;
  };
  radius: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
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
    glow: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    neon: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
  gradients: {
    primary: string[];
    accent: string[];
    surface: string[];
  };
  animation: {
    fast: number;
    normal: number;
    slow: number;
    spring: {
      damping: number;
      stiffness: number;
      mass: number;
    };
  };
  typography: {
    sizes: { xs: number; sm: number; md: number; lg: number; xl: number; '2xl': number; '3xl': number };
    lineHeights: { tight: number; normal: number; relaxed: number };
    weights: { regular: string; medium: string; semibold: string; bold: string };
  };
  states: {
    focus: string;
    pressed: string;
    hover: string;
    disabled: string;
  };
  elevations: {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
  };
}

// Modern Sports Tech - Dark Mode Primary
export const darkTokens: Tokens = {
  colors: {
    // Deep space backgrounds
    background: '#030712',
    surface: '#0A0F1A',
    surfaceAlt: '#111827',
    surfaceGlass: 'rgba(15, 23, 42, 0.6)',
    // Borders
    border: '#1E293B',
    borderAccent: '#334155',
    // Text hierarchy
    textPrimary: '#F8FAFC',
    textSecondary: '#E2E8F0',
    textMuted: '#94A3B8',
    // Neon accent palette
    brand: '#10B981',
    brandAlt: '#06B6D4',
    brandGlow: 'rgba(16, 185, 129, 0.4)',
    // Semantic
    success: '#22C55E',
    successGlow: 'rgba(34, 197, 94, 0.3)',
    warning: '#F59E0B',
    danger: '#EF4444',
    dangerGlow: 'rgba(239, 68, 68, 0.3)',
    // Gradient anchors
    gradientStart: '#10B981',
    gradientMid: '#06B6D4',
    gradientEnd: '#8B5CF6',
    // Shadows
    shadow: '#000000',
    glowPrimary: '#10B981',
    glowSecondary: '#06B6D4',
  },
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  spacing: (n: number) => n * 4,
  shadow: {
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    subtle: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    glow: {
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    },
    neon: {
      shadowColor: '#06B6D4',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  gradients: {
    primary: ['#10B981', '#06B6D4'],
    accent: ['#06B6D4', '#8B5CF6'],
    surface: ['#111827', '#0A0F1A'],
  },
  animation: {
    fast: 150,
    normal: 250,
    slow: 400,
    spring: {
      damping: 15,
      stiffness: 120,
      mass: 1,
    },
  },
  typography: {
    sizes: { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, '2xl': 28, '3xl': 36 },
    lineHeights: { tight: 1.1, normal: 1.3, relaxed: 1.5 },
    weights: { regular: '400', medium: '500', semibold: '600', bold: '700' },
  },
  states: {
    focus: 'rgba(6, 182, 212, 0.5)',
    pressed: 'rgba(16, 185, 129, 0.15)',
    hover: 'rgba(16, 185, 129, 0.08)',
    disabled: 'rgba(148, 163, 184, 0.4)',
  },
  elevations: {
    level1: 2,
    level2: 4,
    level3: 8,
    level4: 12,
  },
};

// Light Mode (Optional)
export const lightTokens: Tokens = {
  colors: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    surfaceGlass: 'rgba(255, 255, 255, 0.8)',
    border: '#E2E8F0',
    borderAccent: '#CBD5E1',
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    brand: '#059669',
    brandAlt: '#0891B2',
    brandGlow: 'rgba(5, 150, 105, 0.2)',
    success: '#16A34A',
    successGlow: 'rgba(22, 163, 74, 0.2)',
    warning: '#D97706',
    danger: '#DC2626',
    dangerGlow: 'rgba(220, 38, 38, 0.2)',
    gradientStart: '#059669',
    gradientMid: '#0891B2',
    gradientEnd: '#7C3AED',
    shadow: '#64748B',
    glowPrimary: '#059669',
    glowSecondary: '#0891B2',
  },
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  spacing: (n: number) => n * 4,
  shadow: {
    card: {
      shadowColor: '#64748B',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    subtle: {
      shadowColor: '#64748B',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 1,
    },
    glow: {
      shadowColor: '#059669',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 4,
    },
    neon: {
      shadowColor: '#0891B2',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
  },
  gradients: {
    primary: ['#059669', '#0891B2'],
    accent: ['#0891B2', '#7C3AED'],
    surface: ['#F1F5F9', '#FFFFFF'],
  },
  animation: {
    fast: 150,
    normal: 250,
    slow: 400,
    spring: {
      damping: 15,
      stiffness: 120,
      mass: 1,
    },
  },
  typography: {
    sizes: { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, '2xl': 28, '3xl': 36 },
    lineHeights: { tight: 1.1, normal: 1.3, relaxed: 1.5 },
    weights: { regular: '400', medium: '500', semibold: '600', bold: '700' },
  },
  states: {
    focus: 'rgba(8, 145, 178, 0.4)',
    pressed: 'rgba(5, 150, 105, 0.12)',
    hover: 'rgba(5, 150, 105, 0.06)',
    disabled: 'rgba(100, 116, 139, 0.4)',
  },
  elevations: {
    level1: 1,
    level2: 3,
    level3: 6,
    level4: 10,
  },
};

// Default export is dark tokens (Modern Sports Tech primary)
export const tokens = darkTokens;
