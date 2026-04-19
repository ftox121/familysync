import { motion } from 'framer-motion'
import { format, isPast, isToday } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Flame, Clock, ChevronRight, Sparkles } from 'lucide-react'
import { cn, CATEGORY_LABELS, STATUS_LABELS } from '@/lib/utils'
import MemberAvatar from './MemberAvatar'

const priorityConfig = {
  high:   { bar: '#ff5c5c', label: 'Высокий', glow: 'rgba(255,92,92,0.25)' },
  medium: { bar: 'hsl(42 88% 58%)', label: 'Средний', glow: 'hsl(42 88% 58% / 0.22)' },
  low:    { bar: 'hsl(136 62% 52%)', label: 'Низкий', glow: 'hsl(136 62% 52% / 0.2)' },
}

const statusStyle = {
  pending:     { bg: 'hsl(136 26% 11%)', text: 'hsl(136 12% 50%)', dot: 'hsl(136 12% 45%)' },
  in_progress: { bg: 'hsl(42 50% 12%)',  text: 'hsl(42 85% 62%)',  dot: 'hsl(42 85% 58%)' },
  completed:   { bg: 'hsl(152 40% 10%)', text: 'hsl(152 60% 50%)', dot: 'hsl(152 60% 45%)' },
}

export default function TaskCard({ task, members, onPress }) {
  const assignee   = members?.find(m => m.user_email === task.assigned_to)
  const isOverdue  = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'completed'
  const isDueToday = task.due_date && isToday(new Date(task.due_date))
  const isCompleted = task.status === 'completed'
  const pConf = priorityConfig[task.priority] ?? priorityConfig.medium
  const sStyle = statusStyle[task.status] ?? statusStyle.pending

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onPress?.(task)}
      className="fs-card-interactive group"
      style={{ opacity: isCompleted ? 0.62 : 1 }}
    >
      {/* Priority left bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full transition-all duration-300 group-hover:top-0 group-hover:bottom-0"
        style={{ background: pConf.bar, boxShadow: `0 0 10px ${pConf.glow}` }}
      />

      <div className="pl-4 pr-3 py-3.5 flex items-start gap-3">
        <div className="flex-1 min-w-0">

          {/* Title row */}
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={cn(
                'font-semibold text-sm leading-snug truncate transition-colors',
                isCompleted ? 'line-through' : 'group-hover:text-[hsl(136,62%,62%)]'
              )}
              style={{ color: isCompleted ? 'hsl(136 12% 48%)' : 'hsl(130 18% 88%)' }}
            >
              {task.title}
            </span>
            {task.is_quest && (
              <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(42 88% 58%)' }} />
            )}
            {task.points_reward > 0 && (
              <span
                className="flex items-center gap-0.5 text-xs font-semibold shrink-0"
                style={{ color: 'hsl(42 88% 62%)', textShadow: '0 0 10px hsl(42 88% 55% / 0.5)' }}
              >
                <Flame className="w-3 h-3" />{task.points_reward}
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-xs line-clamp-1 mb-2" style={{ color: 'hsl(136 12% 48%)' }}>
              {task.description}
            </p>
          )}

          {/* Chips row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Category */}
            <span
              className="badge"
              style={{ background: 'hsl(136 26% 11%)', color: 'hsl(136 12% 54%)', border: '1px solid hsl(136 28% 16%)' }}
            >
              {CATEGORY_LABELS[task.category] ?? task.category}
            </span>

            {/* Status */}
            <span className="badge" style={{ background: sStyle.bg, color: sStyle.text }}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sStyle.dot }} />
              {STATUS_LABELS[task.status]}
            </span>

            {/* Due date */}
            {task.due_date && (
              <span
                className="badge"
                style={{
                  background: isOverdue ? 'hsl(0 50% 12%)' : isDueToday ? 'hsl(270 45% 13%)' : 'transparent',
                  color: isOverdue ? '#ff7070' : isDueToday ? 'hsl(270 70% 72%)' : 'hsl(136 12% 48%)',
                }}
              >
                <Clock className="w-3 h-3" />
                {isOverdue ? 'Просрочено' : isDueToday ? 'Сегодня' : format(new Date(task.due_date), 'd MMM', { locale: ru })}
              </span>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {assignee && <MemberAvatar name={assignee.display_name} color={assignee.avatar_color} size="sm" />}
          <ChevronRight
            className="w-4 h-4 transition-all duration-200 group-hover:translate-x-0.5"
            style={{ color: 'hsl(136 12% 42%)' }}
          />
        </div>
      </div>
    </motion.div>
  )
}
