import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Users, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { base44 } from '@/api/base44Client'
import { useFamilyContext } from '@/context/FamilyContext'
import { ROLE_LABELS, AVATAR_COLORS, generateInviteCode } from '@/lib/utils'

export default function Onboarding() {
  const { user, refresh } = useFamilyContext()
  const [tab, setTab] = useState('create')
  const [familyName, setFamilyName] = useState('')
  const [displayName, setDisplayName] = useState(user?.full_name ?? '')
  const [role, setRole] = useState('parent')
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

  const inputCls =
    'w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-slate-100 text-sm ' +
    'placeholder:text-slate-500 outline-none transition-all duration-200 ' +
    'hover:border-cyan-400/40 hover:bg-white/[0.07] ' +
    'focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/25 focus:bg-white/[0.08]'

  const labelCls = 'text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block'

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950/80 to-slate-900" />
      <div className="pointer-events-none absolute top-[-20%] right-[-10%] w-[420px] h-[420px] rounded-full bg-cyan-500/20 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-15%] left-[-15%] w-[380px] h-[380px] rounded-full bg-violet-500/25 blur-[90px]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-xl shadow-2xl shadow-black/40 p-8">
          <div className="text-center mb-8">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -2 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/30 to-violet-500/30 border border-white/20 flex items-center justify-center mx-auto mb-4"
            >
              <Sparkles className="w-8 h-8 text-cyan-300" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white tracking-tight">СемьяПлан</h1>
            <p className="text-slate-400 mt-2 text-sm">Совместное управление семейными делами</p>
          </div>

          <div className="flex rounded-2xl bg-black/30 p-1 mb-6 gap-1 border border-white/10">
            {[
              ['create', Users, 'Создать семью'],
              ['join', UserPlus, 'Присоединиться'],
            ].map(([key, Icon, label]) => (
              <motion.button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: tab === key ? 1 : 1.02 }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${tab === key
                    ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </motion.button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelCls}>Ваше имя</label>
              <input
                className={inputCls}
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Как вас называть?"
                autoComplete="name"
              />
            </div>

            {tab === 'create' && (
              <div>
                <label className={labelCls}>Название семьи</label>
                <input
                  className={inputCls}
                  value={familyName}
                  onChange={e => setFamilyName(e.target.value)}
                  placeholder="Например: Семья Ивановых"
                  autoComplete="organization"
                />
              </div>
            )}

            <div>
              <label className={labelCls}>Ваша роль</label>
              <select
                className={`${inputCls} cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 24 24%27 stroke=%27%2394a3b8%27%3E%3Cpath stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%272%27 d=%27M19 9l-7 7-7-7%27/%3E%3C/svg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`}
                value={role}
                onChange={e => setRole(e.target.value)}
              >
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k} className="bg-slate-900 text-slate-100">{v}</option>
                ))}
              </select>
            </div>

            {tab === 'join' ? (
              <>
                <div>
                  <label className={labelCls}>Код приглашения</label>
                  <input
                    className={`${inputCls} uppercase tracking-[0.35em] font-semibold`}
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value)}
                    placeholder="XXXXXX"
                    maxLength={6}
                  />
                </div>
                <motion.button
                  type="button"
                  onClick={handleJoin}
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-cyan-600 
                    shadow-lg shadow-violet-500/30 border border-white/10
                    hover:brightness-110 active:brightness-95 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? 'Присоединяемся...' : 'Присоединиться'}
                </motion.button>
              </>
            ) : (
              <motion.button
                type="button"
                onClick={handleCreate}
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-600 to-violet-600 
                  shadow-lg shadow-cyan-500/25 border border-white/10
                  hover:brightness-110 active:brightness-95 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? 'Создаём...' : 'Создать семью'}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
