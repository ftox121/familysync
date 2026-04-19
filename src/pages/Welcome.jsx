import { motion } from 'framer-motion'
import { CheckCircle2, Users, Calendar, Trophy, ArrowRight, Leaf } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const FEATURES = [
  { icon: CheckCircle2, title: 'Управление задачами',   desc: 'Создавайте и распределяйте дела между членами семьи',   color: 'hsl(136 62% 52%)', glow: 'hsl(136 62% 52% / 0.3)' },
  { icon: Users,        title: 'Семейная команда',      desc: 'Отслеживайте прогресс каждого участника в реальном времени', color: 'hsl(200 80% 60%)', glow: 'hsl(200 80% 55% / 0.3)' },
  { icon: Calendar,     title: 'Календарь событий',     desc: 'Планируйте семейные дела и не пропускайте важное',       color: 'hsl(270 70% 68%)', glow: 'hsl(270 70% 62% / 0.3)' },
  { icon: Trophy,       title: 'Система достижений',    desc: 'Зарабатывайте очки и соревнуйтесь в семейном рейтинге', color: 'hsl(42 88% 58%)',  glow: 'hsl(42 88% 55% / 0.35)' },
]

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6"
      style={{ background: 'hsl(136 42% 3.5%)' }}
    >
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-15%] right-[-10%] w-[380px] h-[380px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(136 62% 52% / 0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-[-10%] left-[-15%] w-[340px] h-[340px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(200 80% 55% / 0.1) 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <div className="absolute top-[40%] left-[10%] w-[180px] h-[180px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(42 88% 55% / 0.07) 0%, transparent 70%)', filter: 'blur(30px)' }} />
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
            boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px hsl(136 62% 52% / 0.06)',
          }}
        >
          {/* Logo area */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-center mb-7"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{
                background: 'linear-gradient(135deg, hsl(136 62% 48% / 0.2), hsl(162 65% 42% / 0.15))',
                border: '1px solid hsl(136 62% 52% / 0.25)',
                boxShadow: '0 0 30px hsl(136 62% 52% / 0.15)',
              }}
            >
              <Leaf className="w-8 h-8" style={{ color: 'hsl(136 62% 55%)', filter: 'drop-shadow(0 0 8px hsl(136 62% 52% / 0.7))' }} />
            </motion.div>
            <h1
              className="font-display font-bold mb-3 leading-tight"
              style={{ fontSize: '1.9rem', color: 'hsl(130 18% 92%)' }}
            >
              СемьяПлан
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(136 12% 55%)' }}>
              Организуйте семейные дела вместе. Достигайте целей как одна команда.
            </p>
          </motion.div>

          {/* Features */}
          <div className="space-y-2.5 mb-7">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.28 + i * 0.09, duration: 0.38 }}
                  className="flex items-center gap-3 p-3 rounded-xl group transition-all duration-200"
                  style={{
                    background: 'hsl(136 26% 8%)',
                    border: '1px solid hsl(136 28% 12%)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${f.color.replace(')', ' / 0.28)')}`
                    e.currentTarget.style.background = 'hsl(136 26% 9.5%)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'hsl(136 28% 12%)'
                    e.currentTarget.style.background = 'hsl(136 26% 8%)'
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${f.color.replace(')', ' / 0.12)')}`, border: `1px solid ${f.color.replace(')', ' / 0.2)')}` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: f.color, filter: `drop-shadow(0 0 4px ${f.glow})` }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold mb-0.5" style={{ color: 'hsl(130 18% 84%)' }}>{f.title}</h3>
                    <p className="text-[11px] leading-snug" style={{ color: 'hsl(136 12% 48%)' }}>{f.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* CTA */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.72, duration: 0.4 }}
            onClick={() => navigate('/onboarding')}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="btn-emerald w-full py-3.5 text-base"
          >
            Начать
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
