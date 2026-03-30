import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { toast } from 'sonner'
import { base44 } from '@/api/base44Client'
import { useFamilyContext } from '@/context/FamilyContext'
import { CATEGORY_LABELS, PRIORITY_LABELS, getPointsForPriority } from '@/lib/utils'

export default function AddTask() {
  const navigate = useNavigate()
  const { currentMembership, members, user, refresh } = useFamilyContext()
  const [title, setTitle]         = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo]   = useState('')
  const [priority, setPriority]       = useState('medium')
  const [category, setCategory]       = useState('other')
  const [dueDate, setDueDate]         = useState('')
  const [loading, setLoading]         = useState(false)

  const points = getPointsForPriority(priority)

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Введите название задачи'); return }
    setLoading(true)
    const assignee = members.find(m => m.user_email === assignedTo)
    await base44.entities.Task.create({
      family_id: currentMembership.family_id,
      title: title.trim(),
      description: description.trim(),
      assigned_to: assignedTo || null,
      assigned_name: assignee?.display_name ?? null,
      status: 'pending',
      priority,
      category,
      due_date: dueDate || null,
      points_reward: points,
    })
    if (assignedTo && assignedTo !== user.email) {
      await base44.entities.Notification.create({
        family_id: currentMembership.family_id,
        user_email: assignedTo,
        title: 'Новая задача!',
        message: `Вам назначена задача: "${title.trim()}"`,
        type: 'task_assigned',
      })
    }
    toast.success('Задача создана!')
    refresh()
    navigate('/')
    setLoading(false)
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/30'
  const labelCls = 'text-xs text-muted-foreground mb-1 block'

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 space-y-5">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-bold">Новая задача</h1>
      </div>

      <div className="space-y-4">
        <div>
          <label className={labelCls}>Название *</label>
          <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="Что нужно сделать?" />
        </div>
        <div>
          <label className={labelCls}>Описание</label>
          <textarea className={inputCls + ' h-20 resize-none'} value={description} onChange={e => setDescription(e.target.value)} placeholder="Подробности..." />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Категория</label>
            <select className={inputCls} value={category} onChange={e => setCategory(e.target.value)}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Приоритет</label>
            <select className={inputCls} value={priority} onChange={e => setPriority(e.target.value)}>
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Назначить</label>
          <select className={inputCls} value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
            <option value="">— не назначено —</option>
            {members.map(m => <option key={m.id} value={m.user_email}>{m.display_name}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>Дедлайн</label>
          <input type="date" className={inputCls} value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>

        <div className="bg-violet-50 rounded-xl p-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
          <span className="text-sm">Награда за выполнение: <span className="font-bold text-amber-500">{points} баллов</span></span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-primary text-white font-medium text-sm transition-opacity disabled:opacity-60"
        >
          {loading ? 'Создаём...' : 'Создать задачу'}
        </button>
      </div>
    </motion.div>
  )
}
