import { differenceInHours, endOfDay, isBefore } from 'date-fns'
import { isAdultRole, isChildRole } from '../access/FamilyAccessPolicy'

/**
 * Агрегированная статистика участника для назначения задач.
 * @typedef {Object} MemberWorkloadStats
 * @property {string} userEmail
 * @property {string} displayName
 * @property {string} role
 * @property {number} activeTasks — невыполненные назначенные задачи
 * @property {number} completedTotal
 * @property {number} completedOnTime — завершено не позже конца дня дедлайна (если дедлайн был)
 * @property {number|null} avgCompletionHours — среднее (created → completed), часы
 */

const ACTIVE_STATUSES = new Set(['pending', 'in_progress', 'pending_confirmation'])

function isCompletedOnTime(task) {
  if (!task.completed_at || !task.due_date) return true
  const deadline = endOfDay(new Date(task.due_date))
  return !isBefore(deadline, new Date(task.completed_at))
}

/**
 * Построить статистику по каждому участнику из сырых списков.
 * @param {Array<Record<string, unknown>>} members
 * @param {Array<Record<string, unknown>>} tasks
 * @returns {MemberWorkloadStats[]}
 */
export function buildMemberAssignmentStats(members, tasks) {
  return members.map(m => {
    const email = m.user_email
    const mine = tasks.filter(t => t.assigned_to === email)
    const completed = mine.filter(t => t.status === 'completed')
    const durations = completed
      .filter(t => t.created_date && t.completed_at)
      .map(t => differenceInHours(new Date(t.completed_at), new Date(t.created_date)))

    const avgCompletionHours =
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null

    return {
      userEmail: email,
      displayName: m.display_name ?? email,
      role: m.role,
      activeTasks: mine.filter(t => ACTIVE_STATUSES.has(t.status)).length,
      completedTotal: completed.length,
      completedOnTime: completed.filter(isCompletedOnTime).length,
      avgCompletionHours,
    }
  })
}

/**
 * Нормализация метрик в [0,1] для формулы рейтинга.
 */
function normalizeCompletionRate(stats) {
  if (stats.completedTotal < 1) return 0.5
  return stats.completedOnTime / stats.completedTotal
}

/** Быстрее закрывает задачи → выше score. Без данных — нейтрально 0.5 */
function normalizeSpeed(stats) {
  if (stats.avgCompletionHours == null || stats.avgCompletionHours <= 0) return 0.5
  const cap = 72
  return Math.max(0, Math.min(1, 1 - Math.min(stats.avgCompletionHours, cap) / cap))
}

/** Текущая загрузка: доля от максимума активных задач в семье */
function normalizeLoad(stats, maxActive) {
  if (maxActive <= 0) return 0
  return Math.min(1, stats.activeTasks / maxActive)
}

/**
 * Итоговый балл кандидата:
 * score = completion_rate * 0.5 + speed * 0.3 - load * 0.2
 * Затем лёгкий перекос по роли: дети чаще получают бытовые поручения (+2%), взрослым −3% перегруза иерархией.
 * @param {MemberWorkloadStats} stats
 * @param {number} maxActive
 */
export function computeAssignmentScore(stats, maxActive) {
  const completionRate = normalizeCompletionRate(stats)
  const speed = normalizeSpeed(stats)
  const load = normalizeLoad(stats, maxActive)

  let score = completionRate * 0.5 + speed * 0.3 - load * 0.2

  if (isChildRole(stats.role)) score *= 1.02
  if (isAdultRole(stats.role)) score *= 0.97

  return {
    score: Math.round(score * 1000) / 1000,
    breakdown: { completionRate, speed, load, raw: completionRate * 0.5 + speed * 0.3 - load * 0.2 },
  }
}

/**
 * Рекомендация исполнителя для новой задачи.
 * @returns {{
 *   bestCandidate: { member: MemberWorkloadStats, score: number, breakdown: object } | null,
 *   rankedCandidates: Array<{ member: MemberWorkloadStats, score: number, breakdown: object }>,
 *   recommendationText: string,
 * }}
 */
export function recommendAssignee(members, tasks, options = {}) {
  const statsList = buildMemberAssignmentStats(members, tasks)
  const maxActive = Math.max(1, ...statsList.map(s => s.activeTasks))

  const ranked = statsList
    .map(member => {
      const { score, breakdown } = computeAssignmentScore(member, maxActive)
      return { member, score, breakdown }
    })
    .sort((a, b) => b.score - a.score)

  const best = ranked[0] ?? null

  let recommendationText = 'Недостаточно данных для рекомендации'
  if (best) {
    const name = best.member.displayName
    const frac = best.member.completedTotal
      ? Math.round((best.member.completedOnTime / best.member.completedTotal) * 100)
      : null
    if (frac != null && frac >= 70)
      recommendationText = `Рекомендуем назначить ${name} — он чаще выполняет задачи вовремя`
    else if (best.member.avgCompletionHours != null && best.member.avgCompletionHours <= 24)
      recommendationText = `Рекомендуем назначить ${name} — быстрее других закрывает поручения`
    else if (best.member.activeTasks === 0)
      recommendationText = `Рекомендуем назначить ${name} — сейчас минимальная загрузка`
    else
      recommendationText = `Рекомендуем назначить ${name} — оптимальный баланс нагрузки и дисциплины`
  }

  if (options.localeMessage) recommendationText = options.localeMessage(best)

  return {
    bestCandidate: best,
    rankedCandidates: ranked,
    recommendationText,
  }
}

export const SmartAssignmentService = {
  buildMemberAssignmentStats,
  computeAssignmentScore,
  recommendAssignee,
}
