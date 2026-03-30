import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useFamilyContext } from '@/context/FamilyContext'
import TaskCard from '@/components/TaskCard'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default function CalendarView() {
  const { tasks, members, isLoading } = useFamilyContext()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMonth, setViewMonth] = useState(new Date())
  const navigate = useNavigate()

  const monthDays = useMemo(() => {
    const start = startOfMonth(viewMonth)
    const end   = endOfMonth(viewMonth)
    const days  = eachDayOfInterval({ start, end })
    // padding: Mon=0, so (getDay-1+7)%7
    const padStart = (getDay(start) + 6) % 7
    return { days, padStart }
  }, [viewMonth])

  const taskDates = useMemo(() => {
    const set = new Set()
    tasks.forEach(t => { if (t.due_date) set.add(t.due_date) })
    return set
  }, [tasks])

  const dayTasks = useMemo(
    () => tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), selectedDate)),
    [tasks, selectedDate]
  )

  if (isLoading)
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>

  return (
    <div className="p-5 space-y-5">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Календарь</h1>
        <p className="text-sm text-muted-foreground mt-1">Планируйте задачи по дням</p>
      </div>

      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <button type="button" onClick={() => setViewMonth(m => subMonths(m, 1))} className="p-1 rounded-lg hover:bg-muted shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold capitalize text-center min-w-0">{format(viewMonth, 'LLLL yyyy', { locale: ru })}</span>
          <button type="button" onClick={() => setViewMonth(m => addMonths(m, 1))} className="p-1 rounded-lg hover:bg-muted shrink-0">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex justify-center mb-3">
          <button
            type="button"
            onClick={() => {
              const today = new Date()
              setViewMonth(today)
              setSelectedDate(today)
            }}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
          >
            Сегодня
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[10px] text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: monthDays.padStart }).map((_, i) => <div key={'p' + i} />)}
          {monthDays.days.map(day => {
            const dateStr  = format(day, 'yyyy-MM-dd')
            const isSelected = isSameDay(day, selectedDate)
            const hasTask  = taskDates.has(dateStr)
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(day)}
                className={`aspect-square rounded-xl text-xs flex items-center justify-center transition-colors
                  ${isSelected ? 'bg-primary text-white font-semibold' : 'hover:bg-muted'}
                  ${hasTask && !isSelected ? 'font-bold underline decoration-primary underline-offset-2' : ''}
                `}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold capitalize">{format(selectedDate, 'd MMMM yyyy', { locale: ru })}</h2>
          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{dayTasks.length} задач</span>
        </div>
        <div className="space-y-3">
          <AnimatePresence>
            {dayTasks.length === 0 ? (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-muted-foreground text-sm py-8">
                Нет задач на этот день
              </motion.p>
            ) : dayTasks.map(task => (
              <TaskCard key={task.id} task={task} members={members} onPress={() => navigate(`/task/${task.id}`)} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
