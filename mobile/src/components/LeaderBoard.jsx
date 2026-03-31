import { Medal, Star, Trophy } from 'lucide-react-native'
import { StyleSheet, Text, View } from 'react-native'
import { getLevelProgress } from '../lib/utils'
import { colors } from '../theme'
import MemberAvatar from './MemberAvatar'

const medals = [Trophy, Medal, Star]

export default function LeaderBoard({ members }) {
  const sorted = [...members].sort((a, b) => (b.points || 0) - (a.points || 0))

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Рейтинг семьи</Text>
      {sorted.map((m, i) => {
        const MedalIcon = medals[i] ?? Star
        return (
          <View key={m.id} style={styles.row}>
            <Text style={styles.rank}>{i + 1}</Text>
            <MemberAvatar name={m.display_name} color={m.avatar_color} animalId={m.animal_id} size="sm" />
            <View style={styles.mid}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {m.display_name}
                </Text>
                {i < 3 && <MedalIcon size={14} color={colors.amber} />}
              </View>
              <View style={styles.barRow}>
                <View style={styles.barTrack}>
                  <View
                    style={[styles.barFill, { width: `${getLevelProgress(m.points)}%` }]}
                  />
                </View>
                <Text style={styles.level}>Ур. {m.level ?? 1}</Text>
              </View>
            </View>
            <View style={styles.score}>
              <Text style={styles.scoreVal}>{m.points ?? 0}</Text>
              <Text style={styles.scoreSub}>{m.tasks_completed ?? 0} задач</Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  heading: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rank: { width: 18, fontSize: 12, fontWeight: '700', color: colors.mutedFg },
  mid: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.foreground },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.muted,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 999 },
  level: { fontSize: 10, color: colors.mutedFg },
  score: { alignItems: 'flex-end' },
  scoreVal: { fontSize: 14, fontWeight: '700', color: colors.amber },
  scoreSub: { fontSize: 10, color: colors.mutedFg },
})
