import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

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
export const generateInviteCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase()
