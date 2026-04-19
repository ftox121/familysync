import { cn } from '@/lib/utils'

const sizeMap = {
  sm: { cls: 'w-7 h-7 text-xs', ring: 14 },
  md: { cls: 'w-10 h-10 text-sm', ring: 20 },
  lg: { cls: 'w-14 h-14 text-lg', ring: 28 },
  xl: { cls: 'w-20 h-20 text-2xl', ring: 40 },
}

// Each color has a dark bg + vivid text + a glow color
const colorMap = {
  violet:  { bg: 'hsl(270 50% 14%)', text: 'hsl(270 80% 75%)', glow: 'hsl(270 70% 60% / 0.4)' },
  orange:  { bg: 'hsl(25 50% 14%)',  text: 'hsl(25 90% 65%)',  glow: 'hsl(25 85% 55% / 0.4)' },
  emerald: { bg: 'hsl(152 45% 11%)', text: 'hsl(152 70% 55%)', glow: 'hsl(152 65% 45% / 0.4)' },
  sky:     { bg: 'hsl(200 50% 12%)', text: 'hsl(200 85% 65%)', glow: 'hsl(200 80% 55% / 0.4)' },
  pink:    { bg: 'hsl(330 45% 13%)', text: 'hsl(330 80% 72%)', glow: 'hsl(330 70% 60% / 0.4)' },
  amber:   { bg: 'hsl(42 50% 12%)',  text: 'hsl(42 90% 62%)',  glow: 'hsl(42 85% 52% / 0.4)' },
  rose:    { bg: 'hsl(350 48% 13%)', text: 'hsl(350 80% 70%)', glow: 'hsl(350 70% 58% / 0.4)' },
  teal:    { bg: 'hsl(174 45% 11%)', text: 'hsl(174 70% 52%)', glow: 'hsl(174 65% 42% / 0.4)' },
}

export default function MemberAvatar({ name, color = 'violet', size = 'md', className, interactive = false }) {
  const initial = (name || '?')[0].toUpperCase()
  const { cls } = sizeMap[size] ?? sizeMap.md
  const { bg, text, glow } = colorMap[color] ?? colorMap.violet

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold shrink-0 select-none',
        cls,
        interactive && 'transition-all duration-200 cursor-pointer hover:scale-105',
        className,
      )}
      style={{
        background: bg,
        color: text,
        border: `1px solid ${text.replace(')', ' / 0.25)')}`,
        boxShadow: interactive ? undefined : `0 0 0 1px ${glow}`,
      }}
      onMouseEnter={interactive ? (e) => {
        e.currentTarget.style.boxShadow = `0 0 0 2px ${glow}, 0 0 14px ${glow}`
      } : undefined}
      onMouseLeave={interactive ? (e) => {
        e.currentTarget.style.boxShadow = ''
      } : undefined}
    >
      {initial}
    </div>
  )
}
