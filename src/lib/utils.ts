export const ROLE_LABELS: Record<string, string> = {
  parent: 'Родитель',
  child: 'Ребёнок',
  grandparent: 'Бабушка/Дедушка',
  other: 'Другой',
}

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
}

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  in_progress: 'В процессе',
  completed: 'Выполнено',
}

export const CATEGORY_LABELS: Record<string, string> = {
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

export const getLevel = (points?: number) =>
  Math.floor((points || 0) / POINTS_PER_LEVEL) + 1

export const getLevelProgress = (points?: number) =>
  (((points || 0) % POINTS_PER_LEVEL) / POINTS_PER_LEVEL) * 100

export const getPointsForPriority = (p: string) =>
  p === 'high' ? 20 : p === 'low' ? 5 : 10

export const generateInviteCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase()
