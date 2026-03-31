export const ROLE_LABELS = {
  parent: 'Родитель',
  child: 'Ребёнок',
  grandparent: 'Бабушка/Дедушка',
  other: 'Другой',
}

export const PRIORITY_LABELS = { low: 'Низкий', medium: 'Средний', high: 'Высокий' }

export const STATUS_LABELS = {
  pending: 'Ожидает',
  in_progress: 'В процессе',
  pending_confirmation: 'На проверке',
  completed: 'Выполнено',
}

export const CATEGORY_LABELS = {
  cleaning: 'Уборка',
  cooking: 'Готовка',
  shopping: 'Покупки',
  kids: 'Дети',
  pets: 'Питомцы',
  repair: 'Ремонт',
  garden: 'Сад',
  other: 'Другое',
}

export const AVATAR_COLORS = [
  'violet', 'orange', 'emerald', 'sky', 'pink', 'amber', 'rose', 'teal',
]

export const POINTS_PER_LEVEL = 100

export const getLevel = (points) => Math.floor((points || 0) / POINTS_PER_LEVEL) + 1
export const getLevelProgress = (points) =>
  (((points || 0) % POINTS_PER_LEVEL) / POINTS_PER_LEVEL) * 100
export const getPointsForPriority = (p) =>
  p === 'high' ? 20 : p === 'low' ? 5 : 10
export const getPointsForStars = stars => Math.max(1, Math.min(5, Number(stars) || 1)) * 10
export const generateInviteCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase()

export const AVATAR_PALETTE = {
  violet: { bg: '#ede9fe', text: '#6d28d9' },
  orange: { bg: '#ffedd5', text: '#c2410c' },
  emerald: { bg: '#d1fae5', text: '#047857' },
  sky: { bg: '#e0f2fe', text: '#0369a1' },
  pink: { bg: '#fce7f3', text: '#be185d' },
  amber: { bg: '#fef3c7', text: '#b45309' },
  rose: { bg: '#ffe4e6', text: '#be123c' },
  teal: { bg: '#ccfbf1', text: '#0f766e' },
}

export const AVATAR_SIZES = {
  sm: { wh: 28, font: 12 },
  md: { wh: 40, font: 15 },
  lg: { wh: 56, font: 20 },
  xl: { wh: 72, font: 28 },
}
