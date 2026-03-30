import { motion } from 'framer-motion'
import { CheckCircle2, Users, Calendar, Trophy, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const FEATURES = [
  { icon: CheckCircle2, title: 'Управление задачами', desc: 'Создавайте и распределяйте задачи между членами семьи' },
  { icon: Users, title: 'Семейная команда', desc: 'Отслеживайте прогресс каждого участника' },
  { icon: Calendar, title: 'Календарь событий', desc: 'Планируйте семейные дела и не забывайте о важном' },
  { icon: Trophy, title: 'Система достижений', desc: 'Зарабатывайте очки и повышайте уровень' },
]

export default function Welcome() {
  const navigate = useNavigate()

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
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-400/30 to-violet-500/30 border border-white/20 flex items-center justify-center mx-auto mb-6"
            >
              <Users className="w-10 h-10 text-cyan-300" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-3">СемьяПлан</h1>
            <p className="text-slate-300 text-base leading-relaxed">
              Организуйте семейные дела вместе. Распределяйте задачи, отслеживайте прогресс и достигайте целей как команда.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {FEATURES.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1, duration: 0.4 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white mb-0.5">{feature.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            onClick={() => navigate('/onboarding')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-600 to-violet-600 
              shadow-lg shadow-cyan-500/25 border border-white/10 flex items-center justify-center gap-2
              hover:brightness-110 active:brightness-95 transition-all duration-200"
          >
            Начать
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
