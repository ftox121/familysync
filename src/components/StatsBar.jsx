import { isPast, isToday } from 'date-fns'
import { Clock, TrendingUp, CheckCircle2, AlertCircle, CalendarDays } from 'lucide-react'

export default function StatsBar({ tasks }) {
  const total     = tasks.length
  const completed = tasks.filter(t => t.status === 'completed').length
  const pending   = tasks.filter(t => t.status === 'pending').length
  const inProgress= tasks.filter(t => t.status === 'in_progress').length
  const percent   = total > 0 ? Math.round((completed / total) * 100) : 0

  const active = tasks.filter(t => t.status !== 'completed')
  const overdue = active.filter(
    t => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))
  ).length
  const dueToday = active.filter(t => t.due_date && isToday(new Date(t.due_date))).length

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">Прогресс</span>
        <span className="text-lg font-bold text-primary">{percent}%</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      {(overdue > 0 || dueToday > 0) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {dueToday > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200">
              <CalendarDays className="w-3.5 h-3.5 shrink-0" />
              Сегодня: {dueToday}
            </span>
          )}
          {overdue > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Просрочено: {overdue}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{pending} ожидают</span>
        <span className="flex items-center gap-1 text-amber-500"><TrendingUp className="w-3.5 h-3.5" />{inProgress} в процессе</span>
        <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3.5 h-3.5" />{completed} выполнено</span>
      </div>
    </div>
  )
}
