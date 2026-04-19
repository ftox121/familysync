import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, Users, UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { base44 } from '@/api/base44Client'
import { useFamilyContext } from '@/context/FamilyContext'
import { ROLE_LABELS, AVATAR_COLORS, generateInviteCode } from '@/lib/utils'

export default function Onboarding() {
  const { user, refresh } = useFamilyContext()
  const [tab, setTab]         = useState('create')
  const [familyName, setFamilyName] = useState('')
  const [displayName, setDisplayName] = useState(user?.full_name ?? '')
  const [role, setRole]       = useState('parent')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)

  const randomColor = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]

  const handleCreate = async () => {
    if (!familyName.trim() || !displayName.trim()) { toast.error('Заполните все поля'); return }
    setLoading(true)
    const code = generateInviteCode()
    const family = await base44.entities.Family.create({ name: familyName, invite_code: code, owner_email: user.email })
    await base44.entities.FamilyMember.create({
      family_id: family.id, user_email: user.email, display_name: displayName,
      role, avatar_color: randomColor(), points: 0, tasks_completed: 0, level: 1,
    })
    toast.success(`Семья "${familyName}" создана! Код: ${code}`)
    refresh()
    setLoading(false)
  }

  const handleJoin = async () => {
    if (!joinCode.trim() || !displayName.trim()) { toast.error('Заполните все поля'); return }
    setLoading(true)
    const families = await base44.entities.Family.filter({ invite_code: joinCode.toUpperCase().trim() })
    if (families.length === 0) { toast.error('Семья не найдена. Проверьте код.'); setLoading(false); return }
    const family = families[0]
    await base44.entities.FamilyMember.create({
      family_id: family.id, user_email: user.email, display_name: displayName,
      role, avatar_color: randomColor(), points: 0, tasks_completed: 0, level: 1,
    })
    await base44.entities.Notification.create({
      family_id: family.id, user_email: family.owner_email,
      title: 'Новый участник!', message: `${displayName} присоединился к семье`, type: 'family_invite',
    })
    toast.success(`Вы присоединились к семье "${family.name}"!`)
    refresh()
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6"
      style={{ background: 'hsl(136 42% 3.5%)' }}
    >
      {/* BG orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[380px] h-[380px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(136 62% 52% / 0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-[-15%] left-[-15%] w-[340px] h-[340px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(162 65% 42% / 0.09) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        <div
          className="rounded-3xl p-7"
          style={{
            background: 'hsl(136 38% 6% / 0.9)',
            backdropFilter: 'blur(24px)',
            border: '1px solid hsl(136 28% 14%)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              whileHover={{ scale: 1.06, rotate: -3 }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'hsl(136 62% 52% / 0.12)',
                border: '1px solid hsl(136 62% 52% / 0.22)',
                boxShadow: '0 0 24px hsl(136 62% 52% / 0.12)',
              }}
            >
              <Leaf className="w-7 h-7" style={{ color: 'hsl(136 62% 55%)', filter: 'drop-shadow(0 0 6px hsl(136 62% 52% / 0.7))' }} />
            </motion.div>
            <h1 className="font-display font-bold text-2xl" style={{ color: 'hsl(130 18% 90%)' }}>СемьяПлан</h1>
            <p className="text-xs mt-1.5" style={{ color: 'hsl(136 12% 50%)' }}>Настройте вашу семейную группу</p>
          </div>

          {/* Tab switcher */}
          <div
            className="flex rounded-2xl p-1 mb-5 gap-1"
            style={{ background: 'hsl(136 26% 8%)', border: '1px solid hsl(136 28% 13%)' }}
          >
            {[['create', Users, 'Создать'], ['join', UserPlus, 'Войти в семью']].map(([key, Icon, label]) => (
              <motion.button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                whileTap={{ scale: 0.96 }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={tab === key ? {
                  background: 'linear-gradient(135deg, hsl(136 62% 44%), hsl(162 65% 38%))',
                  color: 'hsl(136 40% 5%)',
                  boxShadow: '0 2px 12px hsl(136 62% 48% / 0.4)',
                } : {
                  color: 'hsl(136 12% 48%)',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </motion.button>
            ))}
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            <div>
              <label className="label-xs mb-2 block">Ваше имя</label>
              <input
                className="fs-input"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Как вас называть?"
                autoComplete="name"
              />
            </div>

            <AnimatePresence mode="wait">
              {tab === 'create' && (
                <motion.div
                  key="family-name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <label className="label-xs mb-2 block">Название семьи</label>
                  <input
                    className="fs-input"
                    value={familyName}
                    onChange={e => setFamilyName(e.target.value)}
                    placeholder="Например: Семья Ивановых"
                    autoComplete="organization"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="label-xs mb-2 block">Ваша роль</label>
              <select
                className="fs-input cursor-pointer"
                value={role}
                onChange={e => setRole(e.target.value)}
              >
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <AnimatePresence mode="wait">
              {tab === 'join' && (
                <motion.div
                  key="invite-code"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <label className="label-xs mb-2 block">Код приглашения</label>
                  <input
                    className="fs-input uppercase tracking-[0.3em] font-bold"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value)}
                    placeholder="XXXXXX"
                    maxLength={6}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="button"
              onClick={tab === 'join' ? handleJoin : handleCreate}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -1 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              className="btn-emerald w-full py-3.5 text-sm"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />{tab === 'join' ? 'Присоединяемся…' : 'Создаём…'}</>
                : tab === 'join' ? 'Присоединиться' : 'Создать семью'
              }
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
