// Цветовая палитра — заменяет CSS-переменные Tailwind
export const Colors = {
  primary:    '#7c3aed',
  primaryLight: '#ede9fe',
  background: '#f8f7ff',
  card:       '#ffffff',
  border:     '#e5e7eb',
  muted:      '#f3f4f6',
  mutedFg:    '#9ca3af',
  foreground: '#111827',

  amber:      '#f59e0b',
  amberLight: '#fef3c7',
  green:      '#16a34a',
  greenLight: '#dcfce7',
  red:        '#ef4444',
  redLight:   '#fee2e2',
  violet:     '#7c3aed',
  violetLight:'#ede9fe',

  white:      '#ffffff',
  black:      '#000000',

  priorityHigh:   '#ef4444',
  priorityMedium: '#f59e0b',
  priorityLow:    '#16a34a',
}

export const avatarColors: Record<string, { bg: string; text: string }> = {
  violet:  { bg: '#ede9fe', text: '#7c3aed' },
  orange:  { bg: '#ffedd5', text: '#ea580c' },
  emerald: { bg: '#d1fae5', text: '#059669' },
  sky:     { bg: '#e0f2fe', text: '#0284c7' },
  pink:    { bg: '#fce7f3', text: '#db2777' },
  amber:   { bg: '#fef3c7', text: '#d97706' },
  rose:    { bg: '#ffe4e6', text: '#e11d48' },
  teal:    { bg: '#ccfbf1', text: '#0d9488' },
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
}

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
}

export const FontSize = {
  xs:  10,
  sm:  12,
  md:  14,
  lg:  16,
  xl:  18,
  xxl: 22,
  xxxl: 28,
}
