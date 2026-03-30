import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Trophy, Medal, Star } from 'lucide-react-native'
import { Colors, Radius, Spacing, FontSize } from '../lib/theme'
import { getLevelProgress } from '../lib/utils'
import MemberAvatar from './MemberAvatar'

const MedalIcons = [Trophy, Medal, Star]

interface Props {
  members: any[]
}

export default function LeaderBoard({ members }: Props) {
  const sorted = [...members].sort((a, b) => (b.points || 0) - (a.points || 0))

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Рейтинг семьи</Text>
      {sorted.map((m, i) => {
        const MedalIcon = MedalIcons[i] ?? Star
        const progress = getLevelProgress(m.points)
        return (
          <View key={m.id} style={styles.row}>
            <Text style={styles.rank}>{i + 1}</Text>
            <MemberAvatar name={m.display_name} color={m.avatar_color} size="sm" />
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{m.display_name}</Text>
                {i < 3 && <MedalIcon size={14} color={Colors.amber} />}
              </View>
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.level}>Ур. {m.level ?? 1}</Text>
              </View>
            </View>
            <View style={styles.scoreCol}>
              <Text style={styles.points}>{m.points ?? 0}</Text>
              <Text style={styles.tasksText}>{m.tasks_completed ?? 0} задач</Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.foreground,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  rank: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.mutedFg,
    width: 16,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.foreground,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.muted,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  level: {
    fontSize: FontSize.xs,
    color: Colors.mutedFg,
  },
  scoreCol: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.amber,
  },
  tasksText: {
    fontSize: FontSize.xs,
    color: Colors.mutedFg,
  },
})
