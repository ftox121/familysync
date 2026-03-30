import { motion } from 'framer-motion'
import { format, isPast, isToday } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Star, Clock, ChevronRight } from 'lucide-react'
import { cn, CATEGORY_LABELS, STATUS_LABELS } from '@/lib/utils'
import MemberAvatar from './MemberAvatar'

const priorityBorder = {
  high:   'border-l-4 border-l-red-500',
  medium: 'border-l-4 border-l-amber-400',
  low:    'border-l-4 border-l-green-500',
}

const statusBadge = {
  pending:     'bg-muted text-muted-foreground',
  in_progress: 'bg-amber-100 text-amber-700',
  completed:   'bg-green-100 text-green-700',
}

export default function TaskCard({ task, members, onPress }) {
  const assignee  = members?.find(m => m.user_email === task.assigned_to)
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'completed'
  const isDueToday= task.due_date && isToday(new Date(task.due_date))
  const isCompleted = task.status === 'completed'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onPress?.(task)}
      className={cn(
        'bg-card rounded-xl p-4 shadow-sm cursor-pointer transition-all hover:shadow-md border border-border',
        priorityBorder[task.priority],
        isCompleted && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('font-semibold text-sm truncate', isCompleted && 'line-through text-muted-foreground')}>
              {task.title}
            </span>
            {task.points_reward > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-amber-500 font-medium shrink-0">
                <Star className="w-3 h-3" />{task.points_reward}
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{task.description}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {CATEGORY_LABELS[task.category] ?? task.category}
            </span>
            <span className={cn('text-[10px] px-2 py-0.5 rounded-full', statusBadge[task.status])}>
              {STATUS_LABELS[task.status]}
            </span>
            {task.due_date && (
              <span className={cn('flex items-center gap-1 text-[10px]',
                isOverdue ? 'text-red-500 font-medium' :
                isDueToday ? 'text-violet-600 font-medium' : 'text-muted-foreground'
              )}>
                <Clock className="w-3 h-3" />
                {isOverdue ? 'Просрочено' : isDueToday ? 'Сегодня' : format(new Date(task.due_date), 'd MMM', { locale: ru })}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {assignee && (
            <MemberAvatar name={assignee.display_name} color={assignee.avatar_color} size="sm" />
          )}
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </motion.div>
  )
}
