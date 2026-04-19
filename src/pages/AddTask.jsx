import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Flame } from 'lucide-react'
import { toast } from 'sonner'
import { base44 } from '@/api/base44Client'
import { useFamilyContext } from '@/context/FamilyContext'
import { CATEGORY_LABELS, PRIORITY_LABELS, getPointsForPriority } from '@/lib/utils'

const PRIORITY_COLORS = {
  high:   { color: '#ff5c5c', bg: 'hsl(0 50% 12%)',   border: 'hsl(0 50% 20%)' },
  medium: { color: 'hsl(42 88% 58%)', bg: 'hsl(42 50% 11%)', border: 'hsl(42 50% 20%)' },
  low:    { color: 'hsl(136 62% 52%)', bg: 'hsl(136 45% 10%)', border: 'hsl(136 45% 18%)' },
}

export default function AddTask() {
  const navigate = useNavigate()
  const { currentMembership, members, user, refresh } = useFamilyContext()
  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [priority, setPriority]     = useState('medium')
  const [category, setCategory]     = useState('other')
  const [dueDate, setDueDate]       = useState('')
  const [loading, setLoading]       = useState(false)

  const points = getPointsForPriority(priority)
  const pConf  = PRIORITY_COLORS[priority]

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Введите название задачи'); return }
    setLoading(true)
    const assignee = members.find(m => m.user_email === assignedTo)
    await base44.entities.Task.create({
      family_id: currentMembership.family_id,
      title: title.trim(), description: description.trim(),
      assigned_to: assignedTo || null, assigned_name: assignee?.display_name ?? null,
      status: 'pending', priority, category, due_date: dueDate || null, points_reward: points,
    })
    if (assignedTo && assignedTo !== user.email) {
      await base44.entities.Notification.create({
        family_id: currentMembership.family_id, user_email: assignedTo,
        title: 'Новая задача!', message: `Вам назначена задача: "${title.trim()}"`, type: 'task_assigned',
      })
    }
    toast.success('Задача создана!')
    refresh()
    navigate('/')
    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="p-5 pb-8 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3 pt-3">
        <motion.button
          onClick={() => navigate(-1)}
          whileHover={{ scale: 1.08, x: -2 }}
          whileTap={{ scale: 0.94 }}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
          style={{ background: 'hsl(136 26% 9%)', border: '1px solid hsl(136 28% 14%)' }}
        >
          <ArrowLeft className="w-4 h-4" style={{ color: 'hsl(136 12% 58%)' }} />
        </motion.button>
        <h1 className="font-display font-bold text-2xl leading-none" style={{ color: 'hsl(130 18% 90%)' }}>
          Новая задача
        </h1>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="label-xs mb-2 block">Название *</label>
          <input
            className="fs-input text-base"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Что нужно сделать?"
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="label-xs mb-2 block">Описание</label>
          <textarea
            className="fs-input h-24 resize-none leading-relaxed"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Подробности…"
          />
        </div>

        {/* Category + Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-xs mb-2 block">Категория</label>
            <select className="fs-input cursor-pointer" value={category} onChange={e => setCategory(e.target.value)}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label-xs mb-2 block">Приоритет</label>
            <select
              className="fs-input cursor-pointer font-semibold"
              value={priority}
              onChange={e => setPriority(e.target.value)}
              style={{ color: pConf.color, borderColor: pConf.border }}
            >
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>

        {/* Assignee */}
        <div>
          <label className="label-xs mb-2 block">Назначить участнику</label>
          <select className="fs-input cursor-pointer" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
            <option value="">— не назначено —</option>
            {members.map(m => <option key={m.id} value={m.user_email}>{m.display_name}</option>)}
          </select>
        </div>

        {/* Due date */}
        <div>
          <label className="label-xs mb-2 block">Дедлайн</label>
          <input type="date" className="fs-input cursor-pointer" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>

        {/* Points preview */}
        <motion.div
          key={priority}
          initial={{ scale: 0.97, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-3 rounded-xl p-3.5"
          style={{ background: pConf.bg, border: `1px solid ${pConf.border}` }}
        >
          <Flame className="w-5 h-5 shrink-0" style={{ color: pConf.color, filter: `drop-shadow(0 0 6px ${pConf.color}88)` }} />
          <div>
            <p className="text-xs" style={{ color: 'hsl(136 12% 55%)' }}>Награда за выполнение</p>
            <p className="font-bold text-lg leading-tight" style={{ color: pConf.color, textShadow: `0 0 12px ${pConf.color}66` }}>
              {points} баллов
            </p>
          </div>
        </motion.div>

        {/* Submit */}
        <motion.button
          onClick={handleSubmit}
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -1 }}
          whileTap={{ scale: loading ? 1 : 0.97 }}
          className="btn-emerald w-full py-3.5 text-sm"
        >
          {loading ? 'Создаём…' : 'Создать задачу'}
        </motion.button>
      </div>
    </motion.div>
  )
}
