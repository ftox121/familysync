import { cn } from '@/lib/utils'

const sizeMap = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
}

const colorMap = {
  violet:  'bg-violet-100 text-violet-600',
  orange:  'bg-orange-100 text-orange-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  sky:     'bg-sky-100 text-sky-600',
  pink:    'bg-pink-100 text-pink-600',
  amber:   'bg-amber-100 text-amber-600',
  rose:    'bg-rose-100 text-rose-600',
  teal:    'bg-teal-100 text-teal-600',
}

export default function MemberAvatar({ name, color = 'violet', size = 'md', className }) {
  const initial = (name || '?')[0].toUpperCase()
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold shrink-0',
        colorMap[color] ?? colorMap.violet,
        sizeMap[size],
        className
      )}
    >
      {initial}
    </div>
  )
}
