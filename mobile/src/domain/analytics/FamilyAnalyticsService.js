import { differenceInHours, endOfDay, isPast } from 'date-fns'

/**
 * @typedef {Object} UserTaskSlice
 * @property {string} userEmail
 * @property {string} displayName
 * @property {number} assignedTotal
 * @property {number} completedTotal
 * @property {number} completionPercent
 * @property {number|null} avgCompletionHours
 */

/**
 * @typedef {Object} OverdueTaskInfo
 * @property {string} id
 * @property {string} title
 * @property {string|null} assigned_to
 * @property {string|null} due_date
 * @property {number} overdueHours
 */

/**
 * Процент выполненных задач по пользователям (из назначенных этому пользователю).
 */
export function completionPercentByUser(members, tasks) {
  return members.map(m => {
    const email = m.user_email
    const mine = tasks.filter(t => t.assigned_to === email)
    const total = mine.length
    const done = mine.filter(t => t.status === 'completed').length
    const completionPercent = total > 0 ? Math.round((done / total) * 1000) / 10 : 0
    return {
      userEmail: email,
      displayName: m.display_name ?? email,
      assignedTotal: total,
      completedTotal: done,
      completionPercent,
    }
  })
}

function taskOverdueHours(task, now) {
  if (!task.due_date) return 0
  const dueEnd = endOfDay(new Date(task.due_date))
  if (!isPast(dueEnd)) return 0
  return Math.max(0, differenceInHours(now, dueEnd))
}

/**
 * Задачи с просроченным дедлайн (после конца дня due_date), не завершённые.
 */
export function findOverdueTasks(tasks, now = new Date()) {
  return tasks
    .filter(t => {
      if (t.status === 'completed' || !t.due_date) return false
      return isPast(endOfDay(new Date(t.due_date)))
    })
    .map(t => ({
      id: t.id,
      title: t.title,
      assigned_to: t.assigned_to ?? null,
      due_date: t.due_date ?? null,
      overdueHours: taskOverdueHours(t, now),
    }))
}

/**
 * Среднее время выполнения в часах по завершённым задачам (created_date → completed_at).
 * @param {Record<string, unknown>[]} tasks
 * @param {{ userEmail?: string }} [filter]
 */
export function averageCompletionTimeHours(tasks, filter = {}) {
  let list = tasks.filter(t => t.status === 'completed' && t.created_date && t.completed_at)
  if (filter.userEmail)
    list = list.filter(t => t.assigned_to === filter.userEmail)
  if (list.length === 0) return null
  const sum = list.reduce(
    (acc, t) => acc + differenceInHours(new Date(t.completed_at), new Date(t.created_date)),
    0
  )
  return Math.round((sum / list.length) * 10) / 10
}

/** Рейтинг по баллам (как в лидерборде), плюс метрики для графиков */
export function buildRankingEntries(members, tasks) {
  const pct = completionPercentByUser(members, tasks)
  const avgAll = averageCompletionTimeHours(tasks)

  return [...members]
    .map(m => {
      const row = pct.find(p => p.userEmail === m.user_email)
      return {
        userEmail: m.user_email,
        displayName: m.display_name ?? m.user_email,
        points: m.points ?? 0,
        tasksCompleted: m.tasks_completed ?? 0,
        completionPercent: row?.completionPercent ?? 0,
        avgCompletionHours: averageCompletionTimeHours(tasks, { userEmail: m.user_email }),
      }
    })
    .sort((a, b) => b.points - a.points)
}

/**
 * Данные для столбчатой диаграммы (completion % по членам семьи).
 * @returns {{ labels: string[], values: number[], colors?: string[] }}
 */
export function toBarChartCompletionData(members, tasks, colors = []) {
  const rows = completionPercentByUser(members, tasks)
  return {
    labels: rows.map(r => r.displayName),
    values: rows.map(r => r.completionPercent),
    colors: colors.length ? colors : undefined,
  }
}

/**
 * Сегменты для кольцевой / pie: распределение активных задач по исполнителям.
 */
export function toDonutActiveTasksByAssignee(members, tasks, palette) {
  const active = tasks.filter(t =>
    ['pending', 'in_progress', 'pending_confirmation'].includes(t.status)
  )
  const byEmail = {}
  for (const t of active) {
    const key = t.assigned_to ?? '_unassigned'
    byEmail[key] = (byEmail[key] || 0) + 1
  }
  const labels = []
  const values = []
  const colors = []
  let i = 0
  for (const [email, count] of Object.entries(byEmail)) {
    const m = members.find(x => x.user_email === email)
    labels.push(m?.display_name ?? (email === '_unassigned' ? 'Без исполнителя' : email))
    values.push(count)
    colors.push(palette[i % palette.length])
    i++
  }
  return { labels, values, colors }
}

/**
 * Пример агрегированного снимка для экрана аналитики.
 */
export function buildFamilyAnalyticsSnapshot(members, tasks, now = new Date()) {
  const overdue = findOverdueTasks(tasks, now)
  const ranking = buildRankingEntries(members, tasks)
  const avgFamily = averageCompletionTimeHours(tasks)
  const bar = toBarChartCompletionData(members, tasks)

  return {
    generatedAt: now.toISOString(),
    completionByUser: completionPercentByUser(members, tasks),
    overdueTasks: overdue,
    overdueCount: overdue.length,
    averageCompletionHoursFamily: avgFamily,
    ranking,
    charts: {
      completionBar: bar,
      donutActive: toDonutActiveTasksByAssignee(members, tasks, [
        '#7549e0',
        '#d97706',
        '#16a34a',
        '#0284c7',
        '#db2777',
      ]),
    },
  }
}

export const FamilyAnalyticsService = {
  completionPercentByUser,
  findOverdueTasks,
  averageCompletionTimeHours,
  buildRankingEntries,
  toBarChartCompletionData,
  toDonutActiveTasksByAssignee,
  buildFamilyAnalyticsSnapshot,
}
