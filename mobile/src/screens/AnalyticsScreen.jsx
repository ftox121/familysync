import { BarChart3 } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ScreenBackground from '../components/ScreenBackground'
import { useFamilyAnalyticsViewModel } from '../hooks/useFamilyAnalyticsViewModel'
import { useFamilyContext } from '../context/FamilyContext'
import { colors, gradients, radius, shadows, spacing, typography } from '../theme'

const CHART_H = 120

function MiniBarChart({ labels, values, max = 100 }) {
  return (
    <View style={styles.chart}>
      {labels.map((label, i) => {
        const v = values[i] ?? 0
        const h = Math.max(6, (v / max) * CHART_H)
        return (
          <View key={`${label}-${i}`} style={styles.barCol}>
            <View style={[styles.barTrack, { height: CHART_H }]}>
              <LinearGradient
                colors={gradients.barChart}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={[styles.barFill, { height: h }]}
              />
            </View>
            <Text style={styles.barLabel} numberOfLines={1}>
              {label.split(' ')[0]}
            </Text>
            <Text style={styles.barVal}>{v}%</Text>
          </View>
        )
      })}
    </View>
  )
}

export default function AnalyticsScreen({ navigation }) {
  const { members, tasks, isLoading } = useFamilyContext()
  const insets = useSafeAreaInsets()
  const vm = useFamilyAnalyticsViewModel(members, tasks)

  if (isLoading)
    return (
      <ScreenBackground>
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[typography.subtitle, { marginTop: 12 }]}>Считаем метрики…</Text>
        </View>
      </ScreenBackground>
    )

  const { charts, overdueCount, averageCompletionHoursFamily, ranking, completionByUser } = vm
  const bar = charts.completionBar

  return (
    <ScreenBackground>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.back, pressed && { opacity: 0.75 }]}
        >
          <Text style={styles.backText}>‹ Назад</Text>
        </Pressable>
        <Text style={typography.caption}>Семейная статистика</Text>
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <BarChart3 size={22} color={colors.primary} />
          </View>
          <Text style={typography.hero}>Аналитика</Text>
        </View>
        <Text style={[typography.subtitle, { marginTop: 8, lineHeight: 22 }]}>
          Среднее время выполнения:{' '}
          <Text style={styles.bold}>
            {averageCompletionHoursFamily != null ? `${averageCompletionHoursFamily} ч` : '—'}
          </Text>
        </Text>
        <Text style={[typography.subtitle, { marginTop: 4 }]}>
          Просроченных задач: <Text style={styles.bold}>{overdueCount}</Text>
        </Text>

        <View style={[styles.card, shadows.card]}>
          <Text style={styles.cardTitle}>Успех по членам семьи</Text>
          <Text style={styles.cardHint}>Доля завершённых поручений</Text>
          {bar.labels.length > 0 ? (
            <MiniBarChart labels={bar.labels} values={bar.values} />
          ) : (
            <Text style={styles.muted}>Пока мало данных для графика</Text>
          )}
        </View>

        <View style={[styles.card, shadows.card]}>
          <Text style={styles.cardTitle}>Активные задачи</Text>
          {charts.donutActive.labels.map((lbl, i) => (
            <View key={lbl} style={styles.donutRow}>
              <View style={[styles.legendDot, { backgroundColor: charts.donutActive.colors[i] }]} />
              <Text style={styles.donutLabel}>
                {lbl}: <Text style={styles.donutVal}>{charts.donutActive.values[i]}</Text>
              </Text>
            </View>
          ))}
          {charts.donutActive.labels.length === 0 && (
            <Text style={styles.muted}>Нет активных поручений — отличная работа!</Text>
          )}
        </View>

        <View style={[styles.card, shadows.card]}>
          <Text style={styles.cardTitle}>Рейтинг</Text>
          <Text style={styles.cardHint}>Баллы и динамика</Text>
          {ranking.map((r, idx) => (
            <View
              key={r.userEmail}
              style={[styles.rankRow, idx === ranking.length - 1 && styles.rankRowLast]}
            >
              <View style={styles.rankIdxWrap}>
                <Text style={styles.rankIdx}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rankName}>{r.displayName}</Text>
                <Text style={styles.rankMeta}>
                  {r.completionPercent}% задач ·{' '}
                  {r.avgCompletionHours != null ? `~${r.avgCompletionHours} ч/задача` : 'нет истории'}
                </Text>
              </View>
              <View style={styles.ptsPill}>
                <Text style={styles.rankPts}>{r.points} ★</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.card, shadows.card]}>
          <Text style={styles.cardTitle}>Проценты выполнения</Text>
          {completionByUser.map(row => (
            <View key={row.userEmail} style={styles.summaryRow}>
              <Text style={styles.summaryName}>{row.displayName}</Text>
              <Text style={styles.summaryPct}>{row.completionPercent}%</Text>
              <Text style={styles.summaryMeta}>
                {row.completedTotal}/{row.assignedTotal}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenBackground>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: spacing.screen },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  back: { marginBottom: 8, alignSelf: 'flex-start', paddingVertical: 4 },
  backText: { fontSize: 16, color: colors.primary, fontWeight: '700' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 4 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
  },
  bold: { fontWeight: '800', color: colors.text },
  muted: { fontSize: 14, color: colors.textSecondary },
  card: {
    marginTop: 18,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  cardHint: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: 14 },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: CHART_H + 36,
    gap: 4,
  },
  barCol: { flex: 1, alignItems: 'center' },
  barTrack: {
    width: '78%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: colors.muted,
    borderRadius: 8,
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 8 },
  barLabel: { fontSize: 9, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  barVal: { fontSize: 11, fontWeight: '800', color: colors.text },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  donutLabel: { fontSize: 14, color: colors.text, flex: 1 },
  donutVal: { fontWeight: '800' },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rankRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  rankIdxWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankIdx: { fontWeight: '800', color: colors.textSecondary, fontSize: 13 },
  rankName: { fontSize: 15, fontWeight: '700', color: colors.text },
  rankMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  ptsPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.amberSoft,
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.2)',
  },
  rankPts: { fontWeight: '800', color: colors.amber, fontSize: 12 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.muted,
    borderRadius: radius.sm,
  },
  summaryName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  summaryPct: { fontSize: 15, fontWeight: '800', color: colors.primary, width: 48, textAlign: 'right' },
  summaryMeta: { fontSize: 12, color: colors.textMuted, width: 52, textAlign: 'right' },
})
