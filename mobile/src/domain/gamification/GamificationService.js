/**
 * Геймификация: звезды (баллы), уровни с русскими названиями, достижения, серии выполнений.
 */

/** Границы уровней по накопленным звездам (нижняя граница включительно) */
export const LEVEL_TIERS = [
  { minXp: 0,    id: 'novice',      title: 'Новичок',            icon: '🌱' },
  { minXp: 250,  id: 'responsible', title: 'Ответственный',      icon: '⭐' },
  { minXp: 800,  id: 'pencil',      title: 'Семейный карандаш',  icon: '✏️' },
  { minXp: 2000, id: 'pillar',      title: 'Опора семьи',        icon: '🛡️' },
  { minXp: 4500, id: 'legend',      title: 'Легенда семьи',      icon: '👑' },
]

/** Множитель XP за задачу в зависимости от текущих очков участника */
export function getRankXpMultiplier(xp) {
  if (xp >= 4500) return 1.5
  if (xp >= 2000) return 1.35
  if (xp >= 800)  return 1.2
  if (xp >= 250)  return 1.1
  return 1.0
}

/**
 * Баллы за задачу:
 * base = f(приоритет) × (1 + серия) + бонус за соблюдение срока
 * серия: +5% за каждую задачу подряд в окне 48ч, макс +25%
 */
export function computeTaskRewardXp(task, context = {}) {
  const base = task.points_reward
    ? task.points_reward
    : (task.priority === 'high' ? 20 : task.priority === 'low' ? 5 : 10)

  const streak = Math.min(5, context.streakCount ?? 0)
  const streakMultiplier = 1 + streak * 0.05

  let bonus = 0
  if (task.due_date && task.completed_at) {
    const dueEnd = task.due_date.includes('T')
      ? new Date(task.due_date)
      : new Date(task.due_date + 'T23:59:59')
    if (new Date(task.completed_at) <= dueEnd) bonus += 5
  }

  const rankMultiplier = getRankXpMultiplier(context.memberXp ?? 0)
  const raw = (base * streakMultiplier + bonus) * rankMultiplier
  const total = Math.round(raw)
  return {
    total,
    base,
    streakMultiplier,
    onTimeBonus: bonus,
    rankMultiplier,
  }
}

export function getTierForXp(totalXp) {
  const xp = Math.max(0, totalXp)
  let current = LEVEL_TIERS[0]
  for (const tier of LEVEL_TIERS) {
    if (xp >= tier.minXp) current = tier
  }
  const idx = LEVEL_TIERS.indexOf(current)
  const next = LEVEL_TIERS[idx + 1]
  const xpIntoTier = xp - current.minXp
  const xpToNext = next ? next.minXp - xp : 0
  const span = next ? next.minXp - current.minXp : 1
  const progressPercent = next ? Math.min(100, Math.round((xpIntoTier / span) * 100)) : 100
  return {
    tier: current,
    nextTier: next,
    xpIntoTier,
    xpToNext,
    progressPercent,
  }
}

/** Достижения */
export const ACHIEVEMENTS = {
  first_task: {
    id: 'first_task',
    icon: '⭐',
    title: 'Первый шаг',
    description: 'Выполнена первая задача',
    goal: 1,
    progressKey: 'totalCompleted',
    predicate: ({ totalCompleted }) => totalCompleted >= 1,
  },
  five_tasks: {
    id: 'five_tasks',
    icon: '🧺',
    title: 'На старте',
    description: 'Выполнено 5 задач',
    goal: 5,
    progressKey: 'totalCompleted',
    predicate: ({ totalCompleted }) => totalCompleted >= 5,
  },
  ten_tasks: {
    id: 'ten_tasks',
    icon: '🚀',
    title: 'Разогнался',
    description: 'Выполнено 10 задач',
    goal: 10,
    progressKey: 'totalCompleted',
    predicate: ({ totalCompleted }) => totalCompleted >= 10,
  },
  twenty_five_tasks: {
    id: 'twenty_five_tasks',
    icon: '🛠',
    title: 'Надежная опора',
    description: 'Выполнено 25 задач',
    goal: 25,
    progressKey: 'totalCompleted',
    predicate: ({ totalCompleted }) => totalCompleted >= 25,
  },
  ten_streak: {
    id: 'ten_streak',
    icon: '🔥',
    title: 'Десяточка',
    description: '10 задач подряд без провалов серии',
    goal: 10,
    progressKey: 'streakCount',
    predicate: ({ streakCount }) => streakCount >= 10,
  },
  streak_3: {
    id: 'streak_3',
    icon: '✨',
    title: 'Поймал темп',
    description: '3 задачи подряд без разрыва серии',
    goal: 3,
    progressKey: 'streakCount',
    predicate: ({ streakCount }) => streakCount >= 3,
  },
  streak_5: {
    id: 'streak_5',
    icon: '⚡',
    title: 'В ритме',
    description: '5 задач подряд без разрыва серии',
    goal: 5,
    progressKey: 'streakCount',
    predicate: ({ streakCount }) => streakCount >= 5,
  },
  fifty_tasks: {
    id: 'fifty_tasks',
    icon: '🏆',
    title: 'Супер помощник',
    description: '50 выполненных задач',
    goal: 50,
    progressKey: 'totalCompleted',
    predicate: ({ totalCompleted }) => totalCompleted >= 50,
  },
  punctual_15: {
    id: 'punctual_15',
    icon: '⏰',
    title: 'Пунктуальный',
    description: '15 задач в срок подряд',
    goal: 15,
    progressKey: 'onTimeStreak',
    predicate: ({ onTimeStreak }) => onTimeStreak >= 15,
  },
  punctual_3: {
    id: 'punctual_3',
    icon: '📅',
    title: 'Точно в срок',
    description: '3 задачи подряд выполнены вовремя',
    goal: 3,
    progressKey: 'onTimeStreak',
    predicate: ({ onTimeStreak }) => onTimeStreak >= 3,
  },
  punctual_7: {
    id: 'punctual_7',
    icon: '⌛',
    title: 'Хозяин времени',
    description: '7 задач подряд выполнены вовремя',
    goal: 7,
    progressKey: 'onTimeStreak',
    predicate: ({ onTimeStreak }) => onTimeStreak >= 7,
  },
  points_100: {
    id: 'points_100',
    icon: '⭐',
    title: 'Первые звезды',
    description: 'Накоплено 100 звезд',
    goal: 100,
    progressKey: 'currentPoints',
    predicate: ({ currentPoints }) => currentPoints >= 100,
  },
  points_300: {
    id: 'points_300',
    icon: '🌟',
    title: 'Звездный запас',
    description: 'Накоплено 300 звезд',
    goal: 300,
    progressKey: 'currentPoints',
    predicate: ({ currentPoints }) => currentPoints >= 300,
  },
  points_700: {
    id: 'points_700',
    icon: '💫',
    title: 'Сияющий герой',
    description: 'Накоплено 700 звезд',
    goal: 700,
    progressKey: 'currentPoints',
    predicate: ({ currentPoints }) => currentPoints >= 700,
  },
}

/**
 * Разблокировка достижений (дельта к уже сохранённым id).
 * @param {object} member — FamilyMember с полями tasks_completed и achievements_json (строка JSON массива id)
 * @param {object} state — { streakCount, onTimeStreak }
 */
export function evaluateNewAchievements(member, state) {
  const prev = safeParseArray(member.achievements_json)
  const totalCompleted = member.tasks_completed ?? 0
  const ctx = { totalCompleted, currentPoints: member.points ?? 0, ...state }
  const unlocked = []
  for (const def of Object.values(ACHIEVEMENTS)) {
    if (prev.includes(def.id)) continue
    if (def.predicate(ctx)) unlocked.push(def)
  }
  return unlocked
}

function safeParseArray(raw) {
  if (!raw) return []
  try {
    const j = JSON.parse(raw)
    return Array.isArray(j) ? j : []
  } catch {
    return []
  }
}

/**
 * Обновить серию: если последнее завершение было < 48ч назад — инкремент, иначе сброс.
 */
export function nextStreakCount(previousCount, lastCompletedAtIso, now = new Date()) {
  if (!lastCompletedAtIso) return 1
  const hours = (now - new Date(lastCompletedAtIso)) / 3600000
  if (hours <= 48) return (previousCount ?? 0) + 1
  return 1
}

/**
 * Серия «в срок» — инкремент если вовремя, иначе 0
 */
export function nextOnTimeStreak(previousOnTime, wasOnTime) {
  if (!wasOnTime) return 0
  return (previousOnTime ?? 0) + 1
}

export function wasTaskCompletedOnTime(task) {
  if (!task.due_date || !task.completed_at) return true
  // Use explicit UTC end-of-day so the comparison is consistent regardless of
  // the device's local timezone. If due_date already has a time component ('T'),
  // parse it as-is (it carries its own offset).
  const dueEnd = task.due_date.includes('T')
    ? new Date(task.due_date)
    : new Date(task.due_date + 'T23:59:59Z')
  return new Date(task.completed_at) <= dueEnd
}

/** Собрать прогресс для UI (пример пользователя) */
export function buildGamificationProfileView(member, tasksForMember = []) {
  const xp = member.points ?? 0
  const tier = getTierForXp(xp)
  const completed = tasksForMember.filter(t => t.status === 'completed')
  const achievements = safeParseArray(member.achievements_json)
  return {
    displayName: member.display_name,
    xp,
    tierTitle: tier.tier.title,
    nextTierTitle: tier.nextTier?.title ?? null,
    xpToNextLevel: tier.xpToNext,
    progressToNextPercent: tier.progressPercent,
    streak: member.streak_count ?? 0,
    onTimeStreak: member.on_time_streak ?? 0,
    achievementsUnlocked: achievements,
    completedCount: completed.length,
    exampleLine:
      tier.nextTier != null
        ? `До уровня «${tier.nextTier.title}» осталось ${tier.xpToNext} ★`
        : 'Достигнут высший уровень в семье',
  }
}

export const GamificationService = {
  computeTaskRewardXp,
  getRankXpMultiplier,
  getTierForXp,
  evaluateNewAchievements,
  nextStreakCount,
  nextOnTimeStreak,
  wasTaskCompletedOnTime,
  buildGamificationProfileView,
  ACHIEVEMENTS,
  LEVEL_TIERS,
}
