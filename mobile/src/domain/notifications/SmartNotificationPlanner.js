import { differenceInMinutes, format, isPast } from 'date-fns'

/**
 * @typedef {'reminder_before_deadline'|'overdue_escalation'} SmartNotificationKind
 */

/**
 * Сгенерировать текст напоминания на русском.
 * @example buildReminderCopy('Помыть посуду', 2, 'hours') → 'Осталось 2 ч. до задачи «Помыть посуду»'
 */
export function buildReminderCopy(taskTitle, amount, unit) {
  const u =
    unit === 'hours'
      ? amount === 1
        ? 'час'
        : amount < 5
          ? 'ч.'
          : 'ч.'
      : amount === 1
        ? 'день'
        : 'дн.'
  if (unit === 'hours')
    return `Осталось ${amount} ${u} до задачи «${taskTitle}»`
  return `Осталось ${amount} ${u} до задачи «${taskTitle}»`
}

export function buildOverdueCopy(taskTitle, overdueHours) {
  if (overdueHours < 24)
    return `Задача «${taskTitle}» просрочена уже ${Math.round(overdueHours)} ч.`
  const days = Math.floor(overdueHours / 24)
  return `Задача «${taskTitle}» не выполнена — прошло ${days} дн.`
}

/**
 * Планируемые уведомления по задачам (логика триггеров, без Expo).
 * @param {object} params
 * @param {Record<string, unknown>[]} params.tasks
 * @param {Date} params.now
 * @param {object} params.config
 * @param {number} [params.config.reminderHoursBefore=2]
 * @param {number} [params.config.overdueRepeatHours=12]
 */
export function planSmartNotifications({ tasks, now, config }) {
  const reminderHours = config?.reminderHoursBefore ?? 2
  const overdueRepeat = config?.overdueRepeatHours ?? 12

  const actionable = tasks.filter(t =>
    ['pending', 'in_progress', 'pending_confirmation'].includes(t.status)
  )

  /** @type {Array<{ taskId: string, assigneeEmail: string|null, kind: SmartNotificationKind, title: string, message: string, dedupeKey: string, fireAtISO: string }>} */
  const items = []

  for (const t of actionable) {
    if (t.due_date) {
      const due = new Date(t.due_date + 'T23:59:59')
      const remindAt = new Date(due.getTime() - reminderHours * 3600000)

      if (now >= remindAt && !isPast(due)) {
        const until = differenceInMinutes(due, now)
        const hoursLeft = Math.max(1, Math.round(until / 60))
        items.push({
          taskId: t.id,
          assigneeEmail: t.assigned_to ?? null,
          kind: 'reminder_before_deadline',
          title: 'Скоро дедлайн',
          message: buildReminderCopy(t.title, hoursLeft, 'hours'),
          dedupeKey: `reminder:${t.id}:${format(due, 'yyyy-MM-dd')}`,
          fireAtISO: now.toISOString(),
        })
      }

      if (isPast(due)) {
        const overdueMin = differenceInMinutes(now, due)
        const overdueHours = overdueMin / 60
        const wave = Math.floor(overdueHours / overdueRepeat)
        items.push({
          taskId: t.id,
          assigneeEmail: t.assigned_to ?? null,
          kind: 'overdue_escalation',
          title: 'Просроченная задача',
          message: buildOverdueCopy(t.title, overdueHours),
          dedupeKey: `overdue:${t.id}:wave${wave}`,
          fireAtISO: now.toISOString(),
        })
      }
    }
  }

  return items
}

/**
 * Пример локального планировщика: периодический опрос + колбэк.
 * В продакшене заменить на expo-notifications / FCM + фоновые задачи.
 *
 * @example
 * const stop = createSmartNotificationScheduler({
 *   getTasks: () => tasks,
 *   intervalMs: 60_000,
 *   onDispatch: async (batch) => { for (const n of batch) await api.createNotification(n) }
 * })
 */
export function createSmartNotificationScheduler({
  getTasks,
  intervalMs = 60_000,
  getNow = () => new Date(),
  config,
  onDispatch,
}) {
  let timer = null
  const sent = new Set()

  const tick = async () => {
    const now = getNow()
    const batch = planSmartNotifications({ tasks: getTasks(), now, config }).filter(
      n => !sent.has(n.dedupeKey)
    )
    if (batch.length && onDispatch) {
      await onDispatch(batch)
      batch.forEach(n => sent.add(n.dedupeKey))
    }
  }

  return {
    start() {
      if (timer) return
      timer = setInterval(() => {
        tick().catch(() => {})
      }, intervalMs)
      tick().catch(() => {})
    },
    stop() {
      if (timer) clearInterval(timer)
      timer = null
    },
    flushOnce: tick,
  }
}

export const SmartNotificationPlanner = {
  buildReminderCopy,
  buildOverdueCopy,
  planSmartNotifications,
  createSmartNotificationScheduler,
}
