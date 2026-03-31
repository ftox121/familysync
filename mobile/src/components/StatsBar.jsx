import { isPast, isToday } from 'date-fns'
import { LinearGradient } from 'expo-linear-gradient'
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react-native'
import { StyleSheet, Text, View } from 'react-native'
import { colors, gradients, radius, shadows } from '../theme'

export default function StatsBar({ tasks }) {
  const total = tasks.length
  const completed = tasks.filter(t => t.status === 'completed').length
  const pending = tasks.filter(t => t.status === 'pending').length
  const inProgress = tasks.filter(t => t.status === 'in_progress').length
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  const active = tasks.filter(t => t.status !== 'completed')
  const overdue = active.filter(
    t => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))
  ).length
  const dueToday = active.filter(t => t.due_date && isToday(new Date(t.due_date))).length

  return (
    <View style={[styles.card, shadows.card]}>
      <View style={styles.rowTop}>
        <View>
          <Text style={styles.kicker}>Общий прогресс</Text>
          <Text style={styles.title}>Задачи семьи</Text>
        </View>
        <View style={styles.percentWrap}>
          <Text style={styles.percent}>{percent}</Text>
          <Text style={styles.percentSign}>%</Text>
        </View>
      </View>
      <View style={styles.track}>
        <LinearGradient
          colors={gradients.progress}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${percent}%` }]}
        />
      </View>
      {(overdue > 0 || dueToday > 0) && (
        <View style={styles.chips}>
          {dueToday > 0 && (
            <View style={[styles.chip, styles.chipToday]}>
              <CalendarDays size={14} color={colors.primary} />
              <Text style={styles.chipTodayText}>Сегодня · {dueToday}</Text>
            </View>
          )}
          {overdue > 0 && (
            <View style={[styles.chip, styles.chipOver]}>
              <AlertCircle size={14} color={colors.danger} />
              <Text style={styles.chipOverText}>Просрочено · {overdue}</Text>
            </View>
          )}
        </View>
      )}
      <View style={styles.statsRow}>
        <View style={styles.statPill}>
          <Clock size={15} color={colors.textSecondary} />
          <Text style={styles.statText}>{pending} ждут</Text>
        </View>
        <View style={styles.statPill}>
          <TrendingUp size={15} color={colors.priorityMed} />
          <Text style={[styles.statText, { color: colors.priorityMed }]}>{inProgress} в работе</Text>
        </View>
        <View style={styles.statPill}>
          <CheckCircle2 size={15} color={colors.success} />
          <Text style={[styles.statText, { color: colors.success }]}>{completed} готово</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: { fontSize: 17, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  percentWrap: { flexDirection: 'row', alignItems: 'baseline' },
  percent: { fontSize: 32, fontWeight: '800', color: colors.primary, letterSpacing: -1 },
  percentSign: { fontSize: 16, fontWeight: '700', color: colors.accent, marginLeft: 2 },
  track: {
    height: 10,
    backgroundColor: colors.muted,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: 14,
  },
  fill: { height: '100%', borderRadius: radius.full, minWidth: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  chipToday: { backgroundColor: colors.primaryMuted },
  chipTodayText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  chipOver: { backgroundColor: colors.redSoft },
  chipOverText: { fontSize: 12, fontWeight: '700', color: colors.danger },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.muted,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  statText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
})
