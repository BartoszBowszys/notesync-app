export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  accentContrast: string;
  danger: string;
  dangerHover: string;
  success: string;
}

// Mirrors docs/design-system.md and pwa/src/styles/theme.css — keep both in sync.
export const lightColors: ThemeColors = {
  bg: '#f8fafc',
  surface: '#ffffff',
  surfaceAlt: '#f1f5f9',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  accent: '#6366f1',
  accentHover: '#4f46e5',
  accentContrast: '#ffffff',
  danger: '#dc2626',
  dangerHover: '#b91c1c',
  success: '#16a34a',
};

export const darkColors: ThemeColors = {
  bg: '#0f172a',
  surface: '#1e293b',
  surfaceAlt: '#273549',
  border: '#334155',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  accent: '#818cf8',
  accentHover: '#a5b4fc',
  accentContrast: '#0f172a',
  danger: '#f87171',
  dangerHover: '#fca5a5',
  success: '#4ade80',
};

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 20,
  xl: 24,
};

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
};
