import { isPast, isToday } from 'date-fns'
import { motion } from 'framer-motion'
import { TrendingUp, CheckCircle2, AlertTriangle, CalendarDays, Clock } from 'lucide-react'

export default function StatsBar({ tasks }) {
  const total      = tasks.length
  const completed  = tasks.filter(t => t.status === 'completed').length
  const inProgress = tasks.filter(t => t.status === 'in_progress').length
  const pending    = tasks.filter(t => t.status === 'pending').length
  const percent    = total > 0 ? Math.round((completed / total) * 100) : 0

  const active   = tasks.filter(t => t.status !== 'completed')
  const overdue  = active.filter(t => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))).length
  const dueToday = active.filter(t => t.due_date && isToday(new Date(t.due_date))).length

  return (
    <div
      className="fs-card rounded-2xl p-4 space-y-3"
      style={{ background: 'hsl(136 38% 6.5%)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'hsl(136 12% 48%)' }}>
          Прогресс команды
        </span>
        <motion.span
          key={percent}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="font-display font-bold text-xl text-glow"
          style={{ color: 'hsl(136 62% 52%)' }}
        >
          {percent}%
        </motion.span>
      </div>

      {/* Progress track */}
      <div className="progress-track">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {/* Alert chips */}
      {(overdue > 0 || dueToday > 0) && (
        <div className="flex flex-wrap gap-2">
          {dueToday > 0 && (
            <span
              className="badge text-[11px]"
              style={{ background: 'hsl(270 45% 13%)', color: 'hsl(270 70% 72%)', border: '1px solid hsl(270 45% 20%)' }}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Сегодня: {dueToday}
            </span>
          )}
          {overdue > 0 && (
            <span
              className="badge text-[11px]"
              style={{ background: 'hsl(0 50% 12%)', color: '#ff7070', border: '1px solid hsl(0 50% 20%)' }}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Просрочено: {overdue}
            </span>
          )}
        </div>
      )}

      {/* Mini stats row */}
      <div className="grid grid-cols-3 gap-2 pt-0.5">
        {[
          { icon: Clock,        val: pending,    label: 'ожидают',   color: 'hsl(136 12% 50%)' },
          { icon: TrendingUp,   val: inProgress, label: 'в работе',  color: 'hsl(42 85% 60%)' },
          { icon: CheckCircle2, val: completed,  label: 'готово',    color: 'hsl(152 60% 48%)' },
        ].map(({ icon: Icon, val, label, color }) => (
          <div key={label} className="flex flex-col items-center gap-0.5 py-1.5 rounded-xl" style={{ background: 'hsl(136 26% 9%)' }}>
            <Icon className="w-3.5 h-3.5" style={{ color }} />
            <span className="font-bold text-base leading-none" style={{ color }}>{val}</span>
            <span className="text-[10px]" style={{ color: 'hsl(136 12% 42%)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
