import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Search, UserRound } from 'lucide-react'
import { useFamilyContext } from '@/context/FamilyContext'
import StatsBar from '@/components/StatsBar'
import TaskCard from '@/components/TaskCard'

const FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'pending', label: 'Ожидают' },
  { key: 'in_progress', label: 'В процессе' },
  { key: 'completed', label: 'Выполнено' },
]

const SORT_OPTIONS = [
  { value: 'created', label: 'Сначала новые' },
  { value: 'due_asc', label: 'Срок: ближе' },
  { value: 'due_desc', label: 'Срок: дальше' },
  { value: 'priority', label: 'По важности' },
]

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 }

export default function Tasks() {
  const { tasks, members, family, user, isLoading } = useFamilyContext()
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [mineOnly, setMineOnly] = useState(false)
  const [sortBy, setSortBy] = useState('created')
  const navigate = useNavigate()

  const q = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    let list = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)
    if (mineOnly && user?.email) list = list.filter(t => t.assigned_to === user.email)
    if (q)
      list = list.filter(
        t =>
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q))
      )

    const sorted = [...list]
    const dueTs = (t) => (t.due_date ? new Date(t.due_date).getTime() : Number.POSITIVE_INFINITY)

    if (sortBy === 'created')
      sorted.sort((a, b) => String(b.created_date || '').localeCompare(String(a.created_date || '')))
    else if (sortBy === 'due_asc')
      sorted.sort((a, b) => dueTs(a) - dueTs(b))
    else if (sortBy === 'due_desc')
      sorted.sort((a, b) => dueTs(b) - dueTs(a))
    else if (sortBy === 'priority')
      sorted.sort(
        (a, b) =>
          (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9) ||
          dueTs(a) - dueTs(b)
      )

    return sorted
  }, [tasks, filter, mineOnly, user?.email, q, sortBy])

  if (isLoading)
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>

  return (
    <div className="p-5 space-y-5">
      <div className="pt-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{family?.name ?? 'СемьяПлан'}</p>
        <h1 className="text-2xl font-bold mt-1">Задачи</h1>
      </div>

      <StatsBar tasks={tasks} />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Поиск по названию или описанию…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMineOnly(v => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            mineOnly
              ? 'bg-primary text-white border-primary'
              : 'bg-muted text-muted-foreground border-border'
          }`}
        >
          <UserRound className="w-3.5 h-3.5" />
          Мои задачи
        </button>
        <div className="flex items-center gap-1.5 ml-auto min-w-0">
          <label htmlFor="task-sort" className="text-[10px] text-muted-foreground uppercase tracking-wider shrink-0">
            Сортировка
          </label>
          <select
            id="task-sort"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="max-w-[140px] text-xs py-1.5 px-2 rounded-lg border border-border bg-card outline-none focus:ring-2 focus:ring-primary/30"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <motion.button
            key={f.key}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors ${
              filter === f.key
                ? 'bg-primary text-white border-primary'
                : 'bg-muted text-muted-foreground border-border'
            }`}
          >
            {f.label}
          </motion.button>
        ))}
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-muted-foreground text-sm">
              {q || mineOnly
                ? 'Ничего не нашлось. Попробуйте другой поиск или снимите фильтры.'
                : filter === 'all'
                  ? 'Нет задач. Нажмите + чтобы создать первую!'
                  : 'Нет задач с таким статусом'}
            </motion.p>
          ) : filtered.map(task => (
            <TaskCard key={task.id} task={task} members={members} onPress={() => navigate(`/task/${task.id}`)} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
