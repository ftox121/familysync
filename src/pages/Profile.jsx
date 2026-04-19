import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Users, Copy, Check, LogOut, Flame, Target, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { base44 } from '@/api/base44Client'
import { useFamilyContext } from '@/context/FamilyContext'
import { ROLE_LABELS, getLevel, getLevelProgress } from '@/lib/utils'
import MemberAvatar from '@/components/MemberAvatar'
import LeaderBoard from '@/components/LeaderBoard'

const ROLE_COLORS = {
  parent:      { bg: 'hsl(136 45% 12%)', text: 'hsl(136 62% 52%)', border: 'hsl(136 45% 20%)' },
  grandparent: { bg: 'hsl(270 40% 13%)', text: 'hsl(270 70% 68%)', border: 'hsl(270 40% 22%)' },
  child:       { bg: 'hsl(42 50% 12%)',  text: 'hsl(42 85% 60%)',  border: 'hsl(42 50% 20%)' },
  other:       { bg: 'hsl(136 26% 10%)', text: 'hsl(136 12% 55%)', border: 'hsl(136 28% 16%)' },
}

export default function Profile() {
  const { user, family, currentMembership, members, tasks, isLoading } = useFamilyContext()
  const [copied, setCopied] = useState(false)

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(136 62% 52%)' }} />
      </div>
    )

  const level        = getLevel(currentMembership?.points)
  const levelProgress = getLevelProgress(currentMembership?.points)
  const myTasks      = tasks.filter(t => t.assigned_to === user?.email)
  const myCompleted  = myTasks.filter(t => t.status === 'completed').length
  const toNextLevel  = 100 - ((currentMembership?.points ?? 0) % 100)
  const roleConf     = ROLE_COLORS[currentMembership?.role] ?? ROLE_COLORS.other

  const handleCopy = () => {
    navigator.clipboard.writeText(family?.invite_code ?? '')
    setCopied(true)
    toast.success('Код скопирован!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-5 pb-2 space-y-4"
    >
      <div className="pt-3">
        <h1 className="font-display font-bold text-[2rem] leading-none" style={{ color: 'hsl(130 18% 90%)' }}>
          Профиль
        </h1>
      </div>

      {/* ── Hero card ── */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(136 38% 8%), hsl(136 32% 6%))',
          border: '1px solid hsl(136 28% 15%)',
          boxShadow: '0 0 40px hsl(136 62% 52% / 0.05)',
        }}
      >
        {/* Decorative orb */}
        <div
          className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(136 62% 52% / 0.1) 0%, transparent 70%)' }}
        />

        <div className="flex items-center gap-4 relative">
          {/* Avatar */}
          <div className="relative">
            <MemberAvatar
              name={currentMembership?.display_name ?? user?.full_name}
              color={currentMembership?.avatar_color}
              size="xl"
            />
            <div
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: 'linear-gradient(135deg, hsl(136 62% 48%), hsl(162 65% 42%))',
                color: 'hsl(136 40% 5%)',
                border: '2px solid hsl(136 38% 7%)',
              }}
            >
              {level}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-display font-semibold text-lg leading-tight" style={{ color: 'hsl(130 18% 90%)' }}>
              {currentMembership?.display_name ?? user?.full_name}
            </h2>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block"
              style={{ background: roleConf.bg, color: roleConf.text, border: `1px solid ${roleConf.border}` }}
            >
              {ROLE_LABELS[currentMembership?.role] ?? 'Участник'}
            </span>

            {/* XP bar */}
            <div className="mt-3 space-y-1">
              <div className="flex justify-between items-center">
                <span className="label-xs">Уровень {level}</span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: 'hsl(42 88% 60%)', textShadow: '0 0 10px hsl(42 88% 55% / 0.5)' }}
                >
                  <Flame className="inline w-3 h-3 mr-0.5" />{currentMembership?.points ?? 0} XP
                </span>
              </div>
              <div className="progress-track">
                <motion.div
                  className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <p className="text-[10px]" style={{ color: 'hsl(136 12% 42%)' }}>
                {toNextLevel} XP до уровня {level + 1}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { icon: Target, val: myTasks.length,   label: 'Всего',     color: 'hsl(136 62% 52%)',  glow: 'hsl(136 62% 52% / 0.4)' },
          { icon: Check,  val: myCompleted,       label: 'Выполнено', color: 'hsl(152 60% 48%)',  glow: 'hsl(152 60% 48% / 0.4)' },
          { icon: Flame,  val: currentMembership?.points ?? 0, label: 'Баллов', color: 'hsl(42 88% 60%)', glow: 'hsl(42 88% 55% / 0.4)' },
        ].map(({ icon: Icon, val, label, color, glow }) => (
          <motion.div
            key={label}
            whileHover={{ scale: 1.03 }}
            className="fs-card rounded-xl p-3 text-center cursor-default"
          >
            <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color, filter: `drop-shadow(0 0 5px ${glow})` }} />
            <p className="font-bold text-xl leading-none mb-1" style={{ color, textShadow: `0 0 14px ${glow}` }}>{val}</p>
            <p className="text-[10px]" style={{ color: 'hsl(136 12% 45%)' }}>{label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Family block ── */}
      <div className="fs-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'hsl(130 18% 85%)' }}>
            <Users className="w-4 h-4" style={{ color: 'hsl(136 62% 52%)' }} />
            {family?.name}
          </h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'hsl(136 26% 10%)', color: 'hsl(136 12% 50%)', border: '1px solid hsl(136 28% 14%)' }}
          >
            {members.length} участников
          </span>
        </div>

        {/* Invite code */}
        <div
          className="flex items-center gap-3 rounded-xl p-3 group cursor-pointer transition-all duration-200"
          style={{ background: 'hsl(136 26% 9%)', border: '1px solid hsl(136 28% 13%)' }}
          onClick={handleCopy}
        >
          <div className="flex-1">
            <p className="label-xs mb-1">Код приглашения</p>
            <p
              className="font-mono font-bold tracking-[0.35em] text-lg leading-none"
              style={{ color: 'hsl(136 62% 55%)', textShadow: '0 0 12px hsl(136 62% 52% / 0.45)' }}
            >
              {family?.invite_code}
            </p>
          </div>
          <div
            className="p-2 rounded-lg transition-all duration-200 group-hover:scale-110"
            style={{ background: 'hsl(136 26% 12%)', color: copied ? 'hsl(152 60% 48%)' : 'hsl(136 12% 55%)' }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </div>
        </div>

        {/* Members */}
        <div className="flex flex-wrap gap-2">
          {members.map(m => (
            <div
              key={m.id}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-all duration-200"
              style={{ background: 'hsl(136 26% 9%)', border: '1px solid hsl(136 28% 13%)' }}
            >
              <MemberAvatar name={m.display_name} color={m.avatar_color} size="sm" />
              <div>
                <p className="text-xs font-medium leading-tight" style={{ color: 'hsl(130 18% 84%)' }}>{m.display_name}</p>
                <p className="text-[10px]" style={{ color: 'hsl(136 12% 46%)' }}>{ROLE_LABELS[m.role]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <LeaderBoard members={members} />

      {/* Logout */}
      <button
        onClick={() => base44.auth.logout()}
        className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200"
        style={{
          background: 'hsl(0 50% 10%)',
          border: '1px solid hsl(0 50% 16%)',
          color: 'hsl(0 70% 60%)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'hsl(0 50% 13%)'
          e.currentTarget.style.boxShadow = '0 0 16px hsl(0 70% 55% / 0.2)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'hsl(0 50% 10%)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <LogOut className="w-4 h-4" />
        Выйти из аккаунта
      </button>

      <div className="pb-4" />
    </motion.div>
  )
}
