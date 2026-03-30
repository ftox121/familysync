import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ListTodo, CalendarDays, Bell, User, PlusCircle } from 'lucide-react'
import { useFamilyContext } from '@/context/FamilyContext'

const NAV_ITEMS = [
  { path: '/',              icon: ListTodo,    label: 'Задачи' },
  { path: '/calendar',     icon: CalendarDays,label: 'Календарь' },
  { path: '/add-task',     icon: PlusCircle,  label: 'Добавить', isCenter: true },
  { path: '/notifications',icon: Bell,        label: 'Уведомления', hasNotif: true },
  { path: '/profile',      icon: User,        label: 'Профиль' },
]

export default function BottomNav() {
  const location = useLocation()
  const { notifications } = useFamilyContext()
  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
      <div className="flex items-end justify-around px-2 pt-2 pb-3 max-w-lg mx-auto">
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          if (item.isCenter) {
            return (
              <Link key={item.path} to={item.path} className="relative -mt-4">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
                >
                  <Icon className="w-6 h-6 text-white" />
                </motion.div>
                <span className="text-[10px] text-center block mt-1 text-muted-foreground">{item.label}</span>
              </Link>
            )
          }

          return (
            <Link key={item.path} to={item.path} className="relative flex flex-col items-center gap-1 min-w-[56px]">
              <motion.div whileTap={{ scale: 0.9 }} className="relative">
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                {item.hasNotif && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 text-[10px] text-white rounded-full flex items-center justify-center font-semibold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </motion.div>
              <span className={`text-[10px] transition-colors ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div layoutId="activeTab" className="absolute -top-2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
