/**
 * Дизайн-система FamilySync — минимализм, пастель, «дорогой» стартап-look 2024–2025
 */

export const colors = {
  /** Фоновый градиент (мягкая пастель) */
  gradientStart: '#fef3f8',
  gradientMid: '#f5f3ff',
  gradientEnd: '#f0f9ff',

  /** Текст */
  text: '#2d3748',
  textSecondary: '#718096',
  textMuted: '#a0aec0',

  /** Поверхности */
  surface: 'rgba(255,255,255,0.95)',
  surfaceStrong: '#ffffff',
  glassBorder: 'rgba(255,255,255,0.9)',
  outline: 'rgba(203,213,225,0.4)',

  /** Акценты (мягкие пастельные) */
  primary: '#c084fc',
  primaryDark: '#a855f7',
  accent: '#f9a8d4',
  accent2: '#7dd3fc',

  /** Приоритеты */
  priorityHigh: '#fda4af',
  priorityHighBg: 'rgba(253,164,175,0.15)',
  priorityMed: '#fcd34d',
  priorityMedBg: 'rgba(252,211,77,0.15)',
  priorityLow: '#86efac',
  priorityLowBg: 'rgba(134,239,172,0.15)',

  success: '#86efac',
  successBg: 'rgba(134,239,172,0.15)',
  warning: '#fcd34d',
  danger: '#fda4af',

  tabInactive: '#cbd5e1',
  fabShadow: 'rgba(192,132,252,0.5)',

  /** Совместимость со старыми импортами */
  background: '#fef3f8',
  foreground: '#2d3748',
  card: '#ffffff',
  muted: '#f8fafc',
  mutedFg: '#718096',
  border: 'rgba(203,213,225,0.3)',
  primaryMuted: '#f3e8ff',
  violetSoft: '#fae8ff',
  red: '#fda4af',
  redSoft: '#ffe4e6',
  amber: '#fcd34d',
  amberSoft: '#fef9c3',
  green: '#86efac',
  greenSoft: '#dcfce7',
  orange: '#fdba74',
  sky: '#7dd3fc',
  emerald: '#86efac',
  rose: '#fda4af',
  teal: '#5eead4',
  pink: '#f9a8d4',

  onboardBg: '#0c1222',
  onboardSurface: 'rgba(255,255,255,0.08)',
  onboardSurface2: 'rgba(255,255,255,0.12)',
  onboardBorder: 'rgba(148,163,184,0.25)',
  onboardText: '#f1f5f9',
  onboardMuted: '#94a3b8',
  onboardAccent: '#22d3ee',
  onboardAccent2: '#a78bfa',
}

export const gradients = {
  screen: [colors.gradientStart, colors.gradientMid, colors.gradientEnd],
  primary: ['#c084fc', '#f9a8d4'],
  primaryBtn: ['#c084fc', '#f9a8d4'],
  progress: ['#7dd3fc', '#c084fc'],
  tabFab: ['#c084fc', '#f9a8d4'],
  barChart: ['#c084fc', '#f9a8d4'],
  card: ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.98)'],
}

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  full: 9999,
}

export const shadows = {
  card: {
    shadowColor: '#c084fc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  tabBar: {
    shadowColor: '#c084fc',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 20,
  },
  fab: {
    shadowColor: '#c084fc',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  press: {
    shadowColor: '#c084fc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
}

export const typography = {
  hero: { fontSize: 28, fontWeight: '800', letterSpacing: -0.8, color: colors.text },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4, color: colors.text },
  subtitle: { fontSize: 15, fontWeight: '500', color: colors.textSecondary },
  bodySmall: { fontSize: 13, color: colors.textSecondary },
  caption: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, color: colors.textMuted },
  tabLabel: { fontSize: 10, fontWeight: '700' },
}

export const spacing = { screen: 20 }
