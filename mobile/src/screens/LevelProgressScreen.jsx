import { useRef, useState } from 'react'
import { ChevronLeft } from 'lucide-react-native'
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LEVEL_TIERS } from '../domain/gamification/GamificationService'
import { useFamilyContext } from '../context/FamilyContext'
import { GamificationService } from '../domain/gamification/GamificationService'
import ScreenBackground from '../components/ScreenBackground'
import { colors, radius, shadows } from '../theme'

const { width: SCREEN_W } = Dimensions.get('window')

const TIER_PERKS = {
  newbie: [
    '🌱 Доступ к семейным задачам',
    '⭐ Первые звезды за выполнение',
    '📋 Просмотр расписания семьи',
  ],
  helper: [
    '⚡ Серийные бонусы +5% звезд',
    '🏅 Участие в семейных квестах',
    '🔔 Умные уведомления о задачах',
  ],
  master: [
    '🔥 Повышенные бонусы за серии',
    '💫 Доступ к редким наградам',
    '📊 Персональная статистика',
  ],
  guru: [
    '💎 Доступ к эпическим наградам',
    '🌟 Множитель звезд ×1.2 за квесты',
    '🏆 Место в топ семейного рейтинга',
  ],
  legend: [
    '👑 Статус Легенды семьи',
    '🎯 Все награды без ограничений',
    '✨ Эксклюзивные артефакты',
  ],
}

const TIER_GRADIENTS = {
  newbie:  ['#e0f2fe', '#dbeafe'],
  helper:  ['#ede9fe', '#fae8ff'],
  master:  ['#fef3c7', '#fde68a'],
  guru:    ['#d1fae5', '#a7f3d0'],
  legend:  ['#fce7f3', '#fbcfe8'],
}

const TIER_ACCENT = {
  newbie:  '#7dd3fc',
  helper:  '#c084fc',
  master:  '#fcd34d',
  guru:    '#34d399',
  legend:  '#f9a8d4',
}

export default function LevelProgressScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { currentMembership } = useFamilyContext()
  const xp = currentMembership?.points ?? 0
  const tierVm = GamificationService.getTierForXp(xp)
  const currentTierIdx = LEVEL_TIERS.findIndex(t => t.id === tierVm.tier.id)

  const [activeIdx, setActiveIdx] = useState(currentTierIdx)
  const listRef = useRef(null)

  const onViewableChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) setActiveIdx(viewableItems[0].index)
  })

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 })

  const renderTier = ({ item, index }) => {
    const isCurrent = item.id === tierVm.tier.id
    const isLocked = index > currentTierIdx
    const nextTier = LEVEL_TIERS[index + 1]
    const accent = TIER_ACCENT[item.id]
    const grad = TIER_GRADIENTS[item.id]

    let progressPct = 0
    let progressXp = 0
    let progressMax = nextTier ? nextTier.minXp - item.minXp : 0
    if (isCurrent) {
      progressXp = xp - item.minXp
      progressPct = tierVm.progressPercent
    } else if (!isLocked) {
      progressXp = progressMax
      progressPct = 100
    }

    return (
      <View style={styles.page}>
        <LinearGradient
          colors={isLocked ? ['#f1f5f9', '#e2e8f0'] : grad}
          style={styles.heroCard}
        >
          {isLocked && (
            <View style={styles.lockOverlay}>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          )}
          <Text style={[styles.heroEmoji, isLocked && { opacity: 0.35 }]}>{item.icon}</Text>
          {isCurrent && (
            <View style={[styles.currentBadge, { backgroundColor: accent }]}>
              <Text style={styles.currentBadgeText}>Ваш уровень</Text>
            </View>
          )}
          {!isLocked && !isCurrent && (
            <View style={[styles.doneBadge]}>
              <Text style={styles.doneBadgeText}>✓ Пройден</Text>
            </View>
          )}
        </LinearGradient>

        <Text style={[styles.tierName, isLocked && styles.tierNameLocked]}>
          {item.title}
        </Text>

        <View style={styles.xpRange}>
          <Text style={styles.xpFrom}>{item.minXp} ★</Text>
          <View style={styles.xpRangeLine} />
          <Text style={styles.xpTo}>{nextTier ? `${nextTier.minXp} ★` : '∞'}</Text>
        </View>

        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>текущий прогресс</Text>
          <Text style={[styles.progressXp, { color: isLocked ? colors.textMuted : accent }]}>
            {isCurrent ? xp - item.minXp : isLocked ? 0 : progressMax} / {progressMax || '—'} ★
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPct}%`, backgroundColor: isLocked ? colors.outline : accent },
              ]}
            />
          </View>
        </View>

        <View style={styles.perksBox}>
          <Text style={styles.perksTitle}>Привилегии уровня</Text>
          {TIER_PERKS[item.id].map((perk, i) => (
            <View key={i} style={styles.perkRow}>
              <Text style={[styles.perkText, isLocked && styles.perkTextLocked]}>{perk}</Text>
            </View>
          ))}
        </View>
      </View>
    )
  }

  return (
    <ScreenBackground>
      <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={12}
          >
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.counter}>{activeIdx + 1} / {LEVEL_TIERS.length}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Dots */}
        <View style={styles.dots}>
          {LEVEL_TIERS.map((t, i) => {
            const accent = TIER_ACCENT[t.id]
            const isActive = i === activeIdx
            const isUnlocked = i <= currentTierIdx
            return (
              <Pressable
                key={t.id}
                onPress={() => listRef.current?.scrollToIndex({ index: i, animated: true })}
              >
                <View
                  style={[
                    styles.dot,
                    isActive
                      ? [styles.dotActive, { backgroundColor: accent }]
                      : isUnlocked
                      ? [styles.dotDone, { backgroundColor: accent, opacity: 0.4 }]
                      : styles.dotLocked,
                  ]}
                />
              </Pressable>
            )
          })}
        </View>

        {/* Pager */}
        <FlatList
          ref={listRef}
          data={LEVEL_TIERS}
          keyExtractor={t => t.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          renderItem={renderTier}
          onViewableItemsChanged={onViewableChanged.current}
          viewabilityConfig={viewConfig.current}
          initialScrollIndex={currentTierIdx}
          getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
          style={styles.list}
        />
      </View>
    </ScreenBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.press,
  },
  counter: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 22,
    borderRadius: 4,
    height: 8,
  },
  dotDone: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotLocked: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.outline,
  },
  list: { flex: 1 },
  page: {
    width: SCREEN_W,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  heroCard: {
    height: 200,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    ...shadows.card,
  },
  heroEmoji: {
    fontSize: 72,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(241,245,249,0.6)',
  },
  lockIcon: { fontSize: 48 },
  currentBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  currentBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  doneBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.green,
  },
  doneBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  tierName: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: 10,
  },
  tierNameLocked: { color: colors.textMuted },
  xpRange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  xpFrom: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  xpRangeLine: { flex: 1, height: 1, backgroundColor: colors.outline, marginHorizontal: 12 },
  xpTo: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  progressSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  progressXp: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    backgroundColor: colors.muted,
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outline,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  perksBox: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1.5,
    borderColor: colors.outline,
    gap: 10,
    ...shadows.press,
  },
  perksTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.muted,
    borderRadius: radius.sm,
  },
  perkText: { fontSize: 13, fontWeight: '600', color: colors.text },
  perkTextLocked: { color: colors.textMuted },
})
