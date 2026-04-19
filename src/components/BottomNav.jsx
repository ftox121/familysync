import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ListTodo, CalendarDays, Bell, User, Plus } from 'lucide-react'
import { useFamilyContext } from '@/context/FamilyContext'

const NAV_ITEMS = [
  { path: '/',               icon: ListTodo,    label: 'Задачи' },
  { path: '/calendar',       icon: CalendarDays,label: 'Календарь' },
  { path: '/add-task',       icon: Plus,        label: 'Добавить', isCenter: true },
  { path: '/notifications',  icon: Bell,        label: 'Уведомления', hasNotif: true },
  { path: '/profile',        icon: User,        label: 'Профиль' },
]

export default function BottomNav() {
  const location = useLocation()
  const { notifications } = useFamilyContext()
  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-3 px-4 pointer-events-none">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto w-full max-w-sm"
        style={{
          background: 'hsl(136 38% 6.5% / 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid hsl(136 28% 14%)',
          borderRadius: '1.25rem',
          boxShadow: '0 -2px 0 hsl(136 62% 52% / 0.06), 0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === item.path
            const Icon = item.icon

            if (item.isCenter) {
              return (
                <Link key={item.path} to={item.path} className="relative -mt-5 flex flex-col items-center">
                  <motion.div
                    whileHover={{ scale: 1.08, rotate: 45 }}
                    whileTap={{ scale: 0.92, rotate: 45 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    style={{
                      background: 'linear-gradient(135deg, hsl(136 62% 48%), hsl(162 65% 42%))',
                      boxShadow: '0 4px 20px hsl(136 62% 52% / 0.45), 0 1px 0 rgba(255,255,255,0.12) inset',
                    }}
                    className="w-13 h-13 w-[52px] h-[52px] rounded-xl flex items-center justify-center border border-white/10"
                  >
                    <Icon className="w-5 h-5" style={{ color: 'hsl(136 40% 5%)' }} strokeWidth={2.5} />
                  </motion.div>
                  <span className="text-[10px] mt-1 font-medium" style={{ color: 'hsl(136 12% 48%)' }}>
                    {item.label}
                  </span>
                </Link>
              )
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center gap-0.5 min-w-[52px] py-1 group"
              >
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200"
                  style={{
                    background: isActive ? 'hsl(136 62% 52% / 0.14)' : 'transparent',
                    boxShadow: isActive ? '0 0 12px hsl(136 62% 52% / 0.2)' : 'none',
                  }}
                >
                  <Icon
                    className="w-[18px] h-[18px] transition-all duration-200"
                    style={{
                      color: isActive ? 'hsl(136 62% 52%)' : 'hsl(136 12% 48%)',
                      filter: isActive ? 'drop-shadow(0 0 6px hsl(136 62% 52% / 0.6))' : 'none',
                    }}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  {item.hasNotif && unreadCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 text-[9px] font-bold rounded-full flex items-center justify-center"
                      style={{
                        background: 'hsl(var(--accent))',
                        color: 'hsl(42 40% 8%)',
                        boxShadow: '0 0 8px hsl(var(--accent) / 0.5)',
                      }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </motion.div>

                <span
                  className="text-[10px] font-medium transition-colors duration-200"
                  style={{ color: isActive ? 'hsl(136 62% 52%)' : 'hsl(136 12% 42%)' }}
                >
                  {item.label}
                </span>

                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="navDot"
                      className="absolute -bottom-0.5 w-1 h-1 rounded-full"
                      style={{ background: 'hsl(136 62% 52%)', boxShadow: '0 0 6px hsl(136 62% 52% / 0.8)' }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    />
                  )}
                </AnimatePresence>
              </Link>
            )
          })}
        </div>
      </motion.div>
    </nav>
  )
}
