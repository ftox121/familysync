import { motion } from 'framer-motion'
import { Crown, Medal, Star } from 'lucide-react'
import { getLevelProgress } from '@/lib/utils'
import MemberAvatar from './MemberAvatar'

const podiumConfig = [
  { icon: Crown,  color: 'hsl(42 88% 58%)',  glow: 'hsl(42 88% 55% / 0.4)',  size: 'text-xs' },
  { icon: Medal,  color: 'hsl(220 25% 65%)', glow: 'hsl(220 25% 60% / 0.3)', size: 'text-xs' },
  { icon: Star,   color: 'hsl(25 80% 58%)',  glow: 'hsl(25 80% 55% / 0.3)',  size: 'text-xs' },
]

export default function LeaderBoard({ members }) {
  const sorted = [...members].sort((a, b) => (b.points || 0) - (a.points || 0))
  const topScore = sorted[0]?.points || 1

  return (
    <div className="fs-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid hsl(136 28% 14%)' }}
      >
        <h3 className="font-display font-semibold text-sm" style={{ color: 'hsl(130 18% 88%)' }}>
          Рейтинг семьи
        </h3>
        <Crown className="w-4 h-4" style={{ color: 'hsl(42 88% 58%)', filter: 'drop-shadow(0 0 6px hsl(42 88% 55% / 0.6))' }} />
      </div>

      <div className="p-3 space-y-1.5">
        {sorted.map((m, i) => {
          const conf = podiumConfig[i]
          const isTop = i === 0
          const barWidth = topScore > 0 ? Math.round(((m.points || 0) / topScore) * 100) : 0
          const progress = getLevelProgress(m.points)

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200"
              style={{
                background: isTop ? 'hsl(42 50% 10%)' : 'hsl(136 26% 8%)',
                border: `1px solid ${isTop ? 'hsl(42 60% 18%)' : 'hsl(136 28% 12%)'}`,
              }}
            >
              {/* Rank */}
              <div className="w-5 flex items-center justify-center shrink-0">
                {conf ? (
                  <conf.icon
                    className="w-3.5 h-3.5"
                    style={{ color: conf.color, filter: `drop-shadow(0 0 4px ${conf.glow})` }}
                  />
                ) : (
                  <span className="text-[11px] font-bold" style={{ color: 'hsl(136 12% 42%)' }}>{i + 1}</span>
                )}
              </div>

              <MemberAvatar name={m.display_name} color={m.avatar_color} size="sm" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-semibold truncate" style={{ color: 'hsl(130 18% 85%)' }}>
                    {m.display_name}
                  </span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: 'hsl(136 26% 13%)', color: 'hsl(136 12% 50%)' }}
                  >
                    Ур.{m.level ?? 1}
                  </span>
                </div>
                {/* Bar */}
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'hsl(136 26% 12%)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${isTop ? progress : barWidth}%` }}
                    transition={{ delay: i * 0.06 + 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      background: isTop
                        ? 'linear-gradient(90deg, hsl(42 88% 52%), hsl(42 88% 65%))'
                        : 'linear-gradient(90deg, hsl(136 62% 44%), hsl(162 65% 50%))',
                      boxShadow: isTop ? '0 0 6px hsl(42 88% 55% / 0.5)' : '0 0 5px hsl(136 62% 48% / 0.4)',
                    }}
                  />
                </div>
              </div>

              {/* Points */}
              <div className="text-right shrink-0">
                <span
                  className="text-sm font-bold block leading-none"
                  style={{
                    color: isTop ? 'hsl(42 88% 62%)' : 'hsl(136 62% 52%)',
                    textShadow: isTop ? '0 0 12px hsl(42 88% 55% / 0.5)' : '0 0 12px hsl(136 62% 48% / 0.4)',
                  }}
                >
                  {m.points ?? 0}
                </span>
                <span className="text-[9px] mt-0.5 block" style={{ color: 'hsl(136 12% 40%)' }}>
                  {m.tasks_completed ?? 0} задач
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
