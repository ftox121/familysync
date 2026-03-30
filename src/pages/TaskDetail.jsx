import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Trash2, Star, Clock, CheckCircle2, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { toast } from 'sonner'
import { base44 } from '@/api/base44Client'
import { useFamilyContext } from '@/context/FamilyContext'
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from '@/lib/utils'
import MemberAvatar from '@/components/MemberAvatar'

export default function TaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { tasks, members, currentMembership, isParent, refresh } = useFamilyContext()
  const [loading, setLoading] = useState(false)

  const task = tasks.find(t => t.id === id)
  const assignee = members?.find(m => m.user_email === task?.assigned_to)

  if (!task)
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>

  const handleStatusChange = async (newStatus) => {
    setLoading(true)
    const updates = { status: newStatus }
    if (newStatus === 'completed' && task.status !== 'completed') {
      updates.completed_at = new Date().toISOString()
      if (task.assigned_to) {
        const member = members.find(m => m.user_email === task.assigned_to)
        if (member) {
          const newPoints = (member.points || 0) + (task.points_reward || 10)
          await base44.entities.FamilyMember.update(member.id, {
            points: newPoints,
            tasks_completed: (member.tasks_completed || 0) + 1,
            level: Math.floor(newPoints / 100) + 1,
          })
          await base44.entities.Notification.create({
            family_id: currentMembership.family_id,
            user_email: task.assigned_to,
            title: 'Задача выполнена! 🎉',
            message: `Вы получили ${task.points_reward || 10} баллов за "${task.title}"`,
            type: 'achievement',
          })
        }
      }
    }
    await base44.entities.Task.update(task.id, updates)
    toast.success('Статус обновлён')
    refresh()
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('Удалить задачу?')) return
    setLoading(true)
    await base44.entities.Task.delete(task.id)
    toast.success('Задача удалена')
    refresh()
    navigate('/')
    setLoading(false)
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/30'

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 space-y-5">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => navigate('/')} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-bold flex-1">Детали задачи</h1>
        {isParent && (
          <button onClick={handleDelete} disabled={loading} className="p-2 text-red-500">
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border space-y-4">
        <div>
          <h2 className="text-lg font-bold">{task.title}</h2>
          {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{CATEGORY_LABELS[task.category]}</span>
          <span className="text-xs px-2 py-1 rounded-full border border-border text-muted-foreground">{PRIORITY_LABELS[task.priority]}</span>
          {task.due_date && (
            <span className="text-xs px-2 py-1 rounded-full border border-border text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />{format(new Date(task.due_date), 'd MMM yyyy', { locale: ru })}
            </span>
          )}
          <span className="text-xs px-2 py-1 rounded-full bg-violet-50 text-violet-700 flex items-center gap-1">
            <Star className="w-3 h-3" />{task.points_reward || 10} баллов
          </span>
        </div>

        {assignee && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            <MemberAvatar name={assignee.display_name} color={assignee.avatar_color} size="md" />
            <div>
              <p className="text-sm font-medium">{assignee.display_name}</p>
              <p className="text-xs text-muted-foreground">Исполнитель</p>
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-2 block">Статус</label>
          <select
            className={inputCls}
            value={task.status}
            onChange={e => handleStatusChange(e.target.value)}
            disabled={loading}
          >
            <option value="pending">Ожидает</option>
            <option value="in_progress">В процессе</option>
            <option value="completed">Выполнено</option>
          </select>
        </div>

        {task.status !== 'completed' && (
          <button
            onClick={() => handleStatusChange('completed')}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <CheckCircle2 className="w-4 h-4" />Отметить выполненным
          </button>
        )}

        {task.completed_at && (
          <p className="text-xs text-muted-foreground text-center">
            Выполнено: {format(new Date(task.completed_at), 'd MMMM yyyy, HH:mm', { locale: ru })}
          </p>
        )}
      </div>
    </motion.div>
  )
}
