import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Clock, TrendingUp, CheckCircle2 } from 'lucide-react-native'
import { Colors, Radius, Spacing, FontSize } from '../lib/theme'

interface Props {
  tasks: any[]
}

export default function StatsBar({ tasks }: Props) {
  const total      = tasks.length
  const completed  = tasks.filter(t => t.status === 'completed').length
  const pending    = tasks.filter(t => t.status === 'pending').length
  const inProgress = tasks.filter(t => t.status === 'in_progress').length
  const percent    = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.label}>Прогресс</Text>
        <Text style={styles.percent}>{percent}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Clock size={13} color={Colors.mutedFg} />
          <Text style={styles.statText}>{pending} ожидают</Text>
        </View>
        <View style={styles.stat}>
          <TrendingUp size={13} color={Colors.amber} />
          <Text style={[styles.statText, { color: Colors.amber }]}>{inProgress} в процессе</Text>
        </View>
        <View style={styles.stat}>
          <CheckCircle2 size={13} color={Colors.green} />
          <Text style={[styles.statText, { color: Colors.green }]}>{completed} выполнено</Text>
        </View>
      </View>
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
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.foreground,
  },
  percent: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.muted,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: FontSize.xs,
    color: Colors.mutedFg,
  },
})
