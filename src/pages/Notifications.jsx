import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Bell, ListTodo, CheckCheck, Clock, Star, UserPlus } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { base44 } from '@/api/base44Client'
import { useFamilyContext } from '@/context/FamilyContext'

const TYPE_CONFIG = {
  task_assigned: { icon: ListTodo,  bg: 'bg-violet-100', text: 'text-violet-600' },
  task_completed:{ icon: CheckCheck,bg: 'bg-emerald-100', text: 'text-emerald-600' },
  reminder:      { icon: Clock,     bg: 'bg-amber-100',  text: 'text-amber-600' },
  achievement:   { icon: Star,      bg: 'bg-orange-100', text: 'text-orange-600' },
  family_invite: { icon: UserPlus,  bg: 'bg-sky-100',    text: 'text-sky-600' },
}

export default function Notifications() {
  const { notifications, refresh, isLoading } = useFamilyContext()

  const handleMarkRead = async (notif) => {
    if (!notif.is_read) {
      await base44.entities.Notification.update(notif.id, { is_read: true })
      refresh()
    }
  }

  const handleMarkAllRead = async () => {
    for (const n of notifications.filter(n => !n.is_read)) {
      await base44.entities.Notification.update(n.id, { is_read: true })
    }
    refresh()
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (isLoading)
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold">Уведомления</h1>
          {unreadCount > 0 && <p className="text-sm text-muted-foreground mt-1">{unreadCount} непрочитанных</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-border">
            <CheckCheck className="w-4 h-4" />Прочитать все
          </button>
        )}
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {notifications.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Нет уведомлений</p>
            </motion.div>
          ) : notifications.map(notif => {
            const cfg = TYPE_CONFIG[notif.type] ?? { icon: Bell, bg: 'bg-muted', text: 'text-muted-foreground' }
            const Icon = cfg.icon
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => handleMarkRead(notif)}
                className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-colors border
                  ${notif.is_read ? 'bg-card border-border' : 'bg-violet-50 border-violet-200'}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                  <Icon className={`w-4 h-4 ${cfg.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${notif.is_read ? '' : 'font-semibold'}`}>{notif.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-snug">{notif.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {notif.created_date ? format(new Date(notif.created_date), 'd MMM, HH:mm', { locale: ru }) : ''}
                  </p>
                </div>
                {!notif.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
