import { Clock3, Gift, Shield, Sparkles, Star } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, radius, shadows } from '../theme'

const RARITY_STYLES = {
  common: { border: 'rgba(148,163,184,0.3)', bg: colors.surfaceStrong, glow: 'rgba(148,163,184,0.12)', text: colors.text },
  rare: { border: 'rgba(59,130,246,0.35)', bg: '#eef6ff', glow: 'rgba(59,130,246,0.16)', text: '#1d4ed8' },
  epic: { border: 'rgba(139,92,246,0.4)', bg: '#f5efff', glow: 'rgba(139,92,246,0.18)', text: '#7c3aed' },
  legendary: { border: 'rgba(245,158,11,0.45)', bg: '#fff7e6', glow: 'rgba(245,158,11,0.2)', text: '#b45309' },
}

const TYPE_META = {
  item: { label: 'Предмет', Icon: Gift },
  artifact: { label: 'Артефакт', Icon: Sparkles },
  privilege: { label: 'Привилегия', Icon: Shield },
}

export default function RewardCard({ reward, currentPoints, isParent, onRedeem }) {
  const rarity = RARITY_STYLES[reward.rarity] || RARITY_STYLES.common
  const type = TYPE_META[reward.type] || TYPE_META.item
  const enough = currentPoints >= reward.points_cost
  const TypeIcon = type.Icon

  return (
    <Pressable
      disabled={isParent || !enough}
      onPress={() => onRedeem?.(reward)}
      style={({ pressed }) => [styles.card, shadows.card, { borderColor: rarity.border, backgroundColor: rarity.bg }, pressed && enough && !isParent && styles.pressed]}
    >
      <View style={[styles.glow, { backgroundColor: rarity.glow }]} />
      <View style={styles.topRow}>
        <View style={styles.leftRow}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>{reward.icon}</Text>
          </View>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{reward.title}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.rarityPill, { borderColor: rarity.border }]}>
                <Star size={11} color={rarity.text} fill={rarity.text} />
                <Text style={[styles.rarityText, { color: rarity.text }]}>{reward.rarity_label || reward.rarity}</Text>
              </View>
              <View style={styles.typePill}>
                <TypeIcon size={11} color={colors.primary} />
                <Text style={styles.typeText}>{type.label}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.costWrap}>
          <Star size={13} color={colors.amber} fill={colors.amber} />
          <Text style={styles.costText}>{reward.points_cost}</Text>
        </View>
      </View>

      <Text style={styles.description}>{reward.description}</Text>

      {reward.type === 'artifact' && reward.duration_hours ? (
        <View style={styles.durationRow}>
          <Clock3 size={13} color={colors.primary} />
          <Text style={styles.durationText}>Активен {reward.duration_hours} ч после получения</Text>
        </View>
      ) : null}

      {!isParent ? (
        <View style={[styles.redeemBar, enough ? styles.redeemBarActive : styles.redeemBarDisabled]}>
          <Text style={[styles.redeemText, !enough && styles.redeemTextDisabled]}>
            {enough ? 'Обменять на награду' : `Нужно еще ${reward.points_cost - currentPoints} XP`}
          </Text>
        </View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.96 },
  glow: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  leftRow: { flexDirection: 'row', gap: 12, flex: 1 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.58)',
  },
  icon: { fontSize: 28 },
  titleWrap: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 6 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rarityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  rarityText: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
  },
  typeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  costWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.amberSoft,
  },
  costText: { fontSize: 12, fontWeight: '800', color: colors.amber },
  description: { fontSize: 13, lineHeight: 19, color: colors.textSecondary, marginTop: 12 },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  durationText: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  redeemBar: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  redeemBarActive: { backgroundColor: colors.primary },
  redeemBarDisabled: { backgroundColor: colors.muted },
  redeemText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  redeemTextDisabled: { color: colors.textMuted },
})
