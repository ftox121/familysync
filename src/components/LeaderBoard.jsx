import { Trophy, Medal, Star } from 'lucide-react'
import { getLevelProgress } from '@/lib/utils'
import MemberAvatar from './MemberAvatar'

const medals = [Trophy, Medal, Star]

export default function LeaderBoard({ members }) {
  const sorted = [...members].sort((a, b) => (b.points || 0) - (a.points || 0))

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border space-y-3">
      <h3 className="text-sm font-semibold">Рейтинг семьи</h3>
      {sorted.map((m, i) => {
        const MedalIcon = medals[i] ?? Star
        return (
          <div key={m.id} className="flex items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
            <MemberAvatar name={m.display_name} color={m.avatar_color} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{m.display_name}</span>
                {i < 3 && <MedalIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${getLevelProgress(m.points)}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">Ур. {m.level ?? 1}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-bold text-amber-500">{m.points ?? 0}</span>
              <p className="text-[10px] text-muted-foreground">{m.tasks_completed ?? 0} задач</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
