import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Users, Copy, Check, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { base44 } from '@/api/base44Client'
import { useFamilyContext } from '@/context/FamilyContext'
import { ROLE_LABELS, getLevel, getLevelProgress } from '@/lib/utils'
import MemberAvatar from '@/components/MemberAvatar'
import LeaderBoard from '@/components/LeaderBoard'

export default function Profile() {
  const { user, family, currentMembership, members, tasks, isLoading } = useFamilyContext()
  const [copied, setCopied] = useState(false)

  if (isLoading)
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>

  const level        = getLevel(currentMembership?.points)
  const levelProgress= getLevelProgress(currentMembership?.points)
  const myTasks      = tasks.filter(t => t.assigned_to === user?.email)
  const myCompleted  = myTasks.filter(t => t.status === 'completed').length

  const handleCopy = () => {
    navigator.clipboard.writeText(family?.invite_code ?? '')
    setCopied(true)
    toast.success('Код скопирован!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 space-y-5">
      <div className="pt-2"><h1 className="text-2xl font-bold">Профиль</h1></div>

      {/* User card */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
        <div className="flex items-center gap-4">
          <MemberAvatar
            name={currentMembership?.display_name ?? user?.full_name}
            color={currentMembership?.avatar_color}
            size="xl"
          />
          <div className="flex-1">
            <h2 className="text-lg font-bold">{currentMembership?.display_name ?? user?.full_name}</h2>
            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground mt-1 inline-block">
              {ROLE_LABELS[currentMembership?.role] ?? 'Участник'}
            </span>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Уровень {level}</span>
                <span className="text-xs font-medium text-amber-500">⭐ {currentMembership?.points ?? 0} баллов</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${levelProgress}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {100 - ((currentMembership?.points ?? 0) % 100)} до следующего уровня
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl p-3 text-center shadow-sm border border-border">
          <p className="text-2xl font-bold text-primary">{myTasks.length}</p>
          <p className="text-[10px] text-muted-foreground">Всего задач</p>
        </div>
        <div className="bg-card rounded-xl p-3 text-center shadow-sm border border-border">
          <p className="text-2xl font-bold text-green-600">{myCompleted}</p>
          <p className="text-[10px] text-muted-foreground">Выполнено</p>
        </div>
        <div className="bg-card rounded-xl p-3 text-center shadow-sm border border-border">
          <p className="text-2xl font-bold text-amber-500">{currentMembership?.points ?? 0}</p>
          <p className="text-[10px] text-muted-foreground">Баллов</p>
        </div>
      </div>

      {/* Family block */}
      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" />{family?.name}
          </h3>
          <span className="text-xs px-2 py-1 rounded-full border border-border text-muted-foreground">{members.length} участников</span>
        </div>

        <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-3">
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Код приглашения</p>
            <p className="text-lg font-mono font-bold tracking-widest">{family?.invite_code}</p>
          </div>
          <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-muted">
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-2 bg-muted/30 rounded-lg px-2 py-1">
              <MemberAvatar name={m.display_name} color={m.avatar_color} size="sm" />
              <div>
                <p className="text-xs font-medium">{m.display_name}</p>
                <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[m.role]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <LeaderBoard members={members} />

      <button
        onClick={() => base44.auth.logout()}
        className="w-full py-3 rounded-xl border border-border text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted"
      >
        <LogOut className="w-4 h-4" />Выйти
      </button>
    </motion.div>
  )
}
