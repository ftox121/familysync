import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Search, UserRound, SlidersHorizontal, Leaf } from 'lucide-react'
import { useFamilyContext } from '@/context/FamilyContext'
import StatsBar from '@/components/StatsBar'
import TaskCard from '@/components/TaskCard'

const FILTERS = [
  { key: 'all',         label: 'Все' },
  { key: 'pending',     label: 'Ожидают' },
  { key: 'in_progress', label: 'В процессе' },
  { key: 'completed',   label: 'Готово' },
]

const SORT_OPTIONS = [
  { value: 'created',  label: 'Новее' },
  { value: 'due_asc',  label: 'Срок ↑' },
  { value: 'due_desc', label: 'Срок ↓' },
  { value: 'priority', label: 'Важность' },
]

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 }

export default function Tasks() {
  const { tasks, members, family, user, isLoading } = useFamilyContext()
  const [filter, setFilter]   = useState('all')
  const [query, setQuery]     = useState('')
  const [mineOnly, setMineOnly] = useState(false)
  const [sortBy, setSortBy]   = useState('created')
  const navigate = useNavigate()

  const q = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    let list = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)
    if (mineOnly && user?.email) list = list.filter(t => t.assigned_to === user.email)
    if (q) list = list.filter(t =>
      (t.title?.toLowerCase().includes(q)) || (t.description?.toLowerCase().includes(q))
    )
    const sorted = [...list]
    const dueTs = t => t.due_date ? new Date(t.due_date).getTime() : Number.POSITIVE_INFINITY
    if (sortBy === 'created')   sorted.sort((a, b) => String(b.created_date || '').localeCompare(String(a.created_date || '')))
    else if (sortBy === 'due_asc')  sorted.sort((a, b) => dueTs(a) - dueTs(b))
    else if (sortBy === 'due_desc') sorted.sort((a, b) => dueTs(b) - dueTs(a))
    else if (sortBy === 'priority') sorted.sort((a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9) || dueTs(a) - dueTs(b))
    return sorted
  }, [tasks, filter, mineOnly, user?.email, q, sortBy])

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'hsl(136 42% 4%)' }}>
        <div className="flex flex-col items-center gap-4">
          <Leaf className="w-8 h-8 animate-pulse-glow" style={{ color: 'hsl(136 62% 52%)' }} />
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'hsl(136 62% 52%)' }} />
        </div>
      </div>
    )

  return (
    <div className="p-5 pb-2 space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pt-3 flex items-end justify-between"
      >
        <div>
          <p className="label-xs mb-1">{family?.name ?? 'СемьяПлан'}</p>
          <h1
            className="font-display font-bold leading-none"
            style={{ fontSize: '2rem', color: 'hsl(130 18% 90%)' }}
          >
            Задачи
          </h1>
        </div>
        <div
          className="text-right"
          style={{ color: 'hsl(136 62% 52%)' }}
        >
          <span className="font-bold text-2xl leading-none" style={{ textShadow: '0 0 14px hsl(136 62% 52% / 0.5)' }}>
            {filtered.length}
          </span>
          <p className="text-[10px]" style={{ color: 'hsl(136 12% 48%)' }}>задач</p>
        </div>
      </motion.div>

      <StatsBar tasks={tasks} />

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: 'hsl(136 12% 48%)' }}
        />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Поиск по задачам…"
          className="fs-input pl-9"
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setMineOnly(v => !v)}
          className="filter-pill flex items-center gap-1.5"
          style={mineOnly ? {
            background: 'hsl(136 62% 52% / 0.12)',
            borderColor: 'hsl(136 62% 52% / 0.55)',
            color: 'hsl(136 62% 52%)',
            boxShadow: '0 0 12px hsl(136 62% 52% / 0.18)',
          } : {}}
        >
          <UserRound className="w-3.5 h-3.5" />
          Мои задачи
        </button>

        <div className="flex items-center gap-1.5 ml-auto">
          <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(136 12% 42%)' }} />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="fs-input py-1.5 px-2 text-xs w-auto cursor-pointer"
            style={{ minWidth: 0 }}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map(f => (
          <motion.button
            key={f.key}
            whileTap={{ scale: 0.94 }}
            onClick={() => setFilter(f.key)}
            className={`filter-pill ${filter === f.key ? 'active' : ''}`}
          >
            {f.label}
          </motion.button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2.5 pb-4">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 gap-4"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'hsl(136 26% 10%)', border: '1px solid hsl(136 28% 15%)' }}
              >
                <Leaf className="w-7 h-7" style={{ color: 'hsl(136 12% 42%)' }} />
              </div>
              <p className="text-center text-sm" style={{ color: 'hsl(136 12% 48%)' }}>
                {q || mineOnly
                  ? 'Ничего не нашлось — попробуйте другой фильтр'
                  : filter === 'all'
                    ? 'Пока нет задач. Нажмите + чтобы создать!'
                    : 'Нет задач с таким статусом'}
              </p>
            </motion.div>
          ) : filtered.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <TaskCard task={task} members={members} onPress={() => navigate(`/task/${task.id}`)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
