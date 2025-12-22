/**
 * AICaddyPro Design Tokens
 * Single source of truth for all design values.
 */

export const colors = {
  // Primary - Course Green
  primary: '#2E8B57',
  primaryLight: '#3CB371',
  primaryDark: '#228B22',
  
  // Accent - Sand/Gold
  accent: '#F4D03F',
  accentAlt: '#DAA520',
  
  // Surfaces - Light Mode
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  
  // Surfaces - Dark Mode
  backgroundDark: '#0F172A',
  surfaceDark: '#1E293B',
  surfaceElevatedDark: '#334155',
  
  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textDark: '#F8FAFC',
  textSecondaryDark: '#CBD5E1',
  
  // Semantic - Scoring
  birdie: '#16A34A',
  par: '#3B82F6',
  bogey: '#F59E0B',
  doublePlus: '#DC2626',
  
  // Semantic - UI
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
  info: '#3B82F6',
  
  // Borders
  border: '#E5E7EB',
  borderDark: '#374151',
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;

export const touchTarget = {
  minimum: 48,
  recommended: 56,
} as const;

export const animation = {
  fast: 150,
  normal: 250,
  slow: 350,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
} as const;

export type ColorKey = keyof typeof colors;
export type SpacingKey = keyof typeof spacing;
