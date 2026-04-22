import React, { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

const RARITY = {
  common: {
    label: 'Common',
    color: '#818CF8', badgeColor: '#4F46E5',
    badgeBg: '#EEF2FF', cardBg: '#FAFAFF',
    border: '#C7D2FE', orbBg: '#4F46E5',
  },
  rare: {
    label: 'Rare',
    color: '#A855F7', badgeColor: '#7C3AED',
    badgeBg: '#F3E8FF', cardBg: '#FEFAFF',
    border: '#D8B4FE', orbBg: '#7C3AED',
  },
  epic: {
    label: 'Epic',
    color: '#EC4899', badgeColor: '#BE185D',
    badgeBg: '#FCE7F3', cardBg: '#FFF8FC',
    border: '#F9A8D4', orbBg: '#BE185D',
  },
  legendary: {
    label: 'Legendary',
    color: '#F59E0B', badgeColor: '#92400E',
    badgeBg: '#FEF3C7', cardBg: '#FFFDF5',
    border: '#FCD34D', orbBg: '#B45309',
  },
}

const TYPE_LABELS = {
  item: 'Предмет',
  artifact: 'Артефакт',
  privilege: 'Привилегия',
}

// Native-driver loop (transform/opacity only)
function useLoopNative({ from = 0, to = 1, duration = 1800, delay = 0 }) {
  const val = useRef(new Animated.Value(from)).current
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(val, { toValue: to,   duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(val, { toValue: from, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [])
  return val
}

// JS-driver loop (layout props)
function useLoopJS({ from = 0, to = 1, duration = 1800, delay = 0 }) {
  const val = useRef(new Animated.Value(from)).current
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(val, { toValue: to,   duration, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(val, { toValue: from, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [])
  return val
}

function Sparkle({ x, y, size = 12, color, delay = 0 }) {
  const op    = useLoopNative({ from: 0, to: 1,   duration: 900, delay })
  const scale = useLoopNative({ from: 0.2, to: 1, duration: 900, delay })
  return (
    <Animated.View style={{
      position: 'absolute', left: x, top: y,
      width: size, height: size,
      opacity: op, transform: [{ scale }],
    }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 0L13.8 10.2L24 12L13.8 13.8L12 24L10.2 13.8L0 12L10.2 10.2Z" fill={color} />
      </Svg>
    </Animated.View>
  )
}

function StarIcon({ color, size = 12 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={color} />
    </Svg>
  )
}

function EmojiOrb({ emoji, rarity }) {
  const r = RARITY[rarity] || RARITY.common
  const isLeg  = rarity === 'legendary'
  const isEpic = rarity === 'epic'
  const isRare = rarity === 'rare'

  const floatY     = useLoopNative({ from: 0,    to: -8,   duration: isLeg ? 2000 : 2600 })
  const glowOp     = useLoopNative({ from: 0.25, to: 0.7,  duration: 2000 })
  const glowScale  = useLoopNative({ from: 0.9,  to: 1.15, duration: 2000 })
  const innerScale = useLoopNative({ from: 1,    to: 1.06, duration: 1800, delay: 200 })

  // Shimmer (JS driver)
  const shimX = useRef(new Animated.Value(-60)).current
  useEffect(() => {
    if (!isRare && !isEpic && !isLeg) return
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimX, { toValue: 60,  duration: 1800, delay: 400, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(shimX, { toValue: -60, duration: 0, useNativeDriver: false }),
        Animated.delay(800),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [])

  return (
    <View style={{ width: 68, height: 68, alignItems: 'center', justifyContent: 'center' }}>
      {/* Glow ring */}
      <Animated.View style={{
        position: 'absolute',
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: r.color,
        opacity: glowOp,
        transform: [{ scale: glowScale }],
      }} />

      {/* Orb */}
      <Animated.View style={{
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: r.orbBg,
        borderWidth: 2, borderColor: r.color,
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        shadowColor: r.color,
        shadowOffset: { width: 0, height: isLeg ? 10 : 6 },
        shadowOpacity: isLeg ? 0.65 : isEpic ? 0.5 : 0.35,
        shadowRadius: isLeg ? 18 : 12,
        elevation: isLeg ? 12 : isEpic ? 8 : 5,
        transform: [{ translateY: floatY }, { scale: innerScale }],
      }}>
        {/* Highlight */}
        <View style={{
          position: 'absolute', top: 4, left: 6,
          width: 18, height: 18, borderRadius: 9,
          backgroundColor: 'rgba(255,255,255,0.28)',
        }} />
        {/* Shimmer */}
        {(isRare || isEpic || isLeg) && (
          <Animated.View style={{
            position: 'absolute', top: 0, bottom: 0, width: 28,
            backgroundColor: 'rgba(255,255,255,0.22)',
            left: shimX,
            transform: [{ skewX: '-20deg' }],
          }} />
        )}
        <Text style={{ fontSize: 26 }}>{emoji}</Text>
      </Animated.View>

      {/* Sparkles for Epic/Legendary */}
      {(isEpic || isLeg) && (
        <>
          <Sparkle x={-6}  y={-4}  size={10} color={r.color} delay={0}   />
          <Sparkle x={56}  y={2}   size={8}  color={r.color} delay={450} />
          <Sparkle x={52}  y={54}  size={10} color={r.color} delay={900} />
        </>
      )}
      {isLeg && (
        <>
          <Sparkle x={-4} y={48}  size={8}  color="#fff"    delay={650} />
          <Sparkle x={28} y={-8}  size={9}  color="#FCD34D" delay={200} />
        </>
      )}
    </View>
  )
}

function CostBadge({ cost, rarity }) {
  const r = RARITY[rarity] || RARITY.common
  const isLeg = rarity === 'legendary'
  const scale = useLoopNative({ from: 1, to: 1.06, duration: 1200 })
  return (
    <Animated.View style={[
      styles.costBadge,
      {
        backgroundColor: r.badgeBg,
        borderColor: r.border,
        transform: isLeg ? [{ scale }] : undefined,
        shadowColor: isLeg ? r.color : 'transparent',
        shadowOpacity: isLeg ? 0.4 : 0,
        shadowRadius: 8,
        elevation: isLeg ? 4 : 0,
      },
    ]}>
      <StarIcon color={r.color} size={13} />
      <Text style={[styles.costText, { color: r.badgeColor }]}>{cost}</Text>
    </Animated.View>
  )
}

function Chip({ label, color, bg }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  )
}

export default function RewardCard({ reward, currentPoints, isParent, onRedeem }) {
  const rarityKey  = String(reward.rarity || 'common').toLowerCase()
  const rarity     = RARITY[rarityKey] || RARITY.common
  const canAfford  = currentPoints >= reward.points_cost
  const canBuy     = canAfford && !reward.pending && !reward.redeeming
  const title      = reward.title || reward.name
  const emoji      = reward.icon || reward.emoji || '🎁'
  const description = reward.description || reward.desc
  const typeLabel  = TYPE_LABELS[reward.type] || reward.type || 'Награда'
  const rarityLabel = reward.rarity_label || rarity.label
  const isLeg  = rarityKey === 'legendary'
  const isEpic = rarityKey === 'epic'

  const pressAnim = useRef(new Animated.Value(1)).current
  const slideAnim = useRef(new Animated.Value(20)).current
  const fadeAnim  = useRef(new Animated.Value(0)).current

  // Animated border for Legendary (JS driver)
  const legGlow = useLoopJS({ from: 0, to: 1, duration: 1600 })

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start()
  }, [])

  const handlePress = () => {
    if (!canBuy) return
    Animated.sequence([
      Animated.timing(pressAnim, { toValue: 0.96, duration: 80,  useNativeDriver: true }),
      Animated.timing(pressAnim, { toValue: 1,    duration: 150, useNativeDriver: true }),
    ]).start()
    onRedeem?.(reward)
  }

  // Outer: JS-driven only (borderColor). Inner: native-driven (transform + opacity).
  // Cannot mix JS and native drivers on the same Animated.View.
  return (
    <Animated.View style={[
      styles.card,
      {
        backgroundColor: rarity.cardBg,
        borderColor: isLeg
          ? legGlow.interpolate({ inputRange: [0, 1], outputRange: [rarity.border, rarity.color] })
          : rarity.border,
        shadowColor: isLeg ? rarity.color : isEpic ? rarity.color : '#A78BFA',
        shadowOpacity: isLeg ? 0.28 : isEpic ? 0.16 : 0.06,
        shadowRadius: isLeg ? 20 : 10,
        elevation: isLeg ? 8 : 3,
      },
    ]}>
      <Animated.View style={{
        transform: [{ translateY: slideAnim }, { scale: pressAnim }],
        opacity: fadeAnim,
      }}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.92} style={styles.inner} disabled={!canBuy}>
        {/* Background glow blob for Leg/Epic */}
        {(isLeg || isEpic) && (
          <View style={styles.blobWrap}>
            <Animated.View style={{
              width: 90, height: 90, borderRadius: 45,
              backgroundColor: rarity.color,
              opacity: legGlow.interpolate({ inputRange: [0, 1], outputRange: [0.07, 0.18] }),
            }} />
          </View>
        )}

        <EmojiOrb emoji={emoji} rarity={rarityKey} />

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={[styles.name, title?.length > 18 && { fontSize: 14 }]} numberOfLines={2}>{title}</Text>
            <CostBadge cost={reward.points_cost} rarity={rarityKey} />
          </View>

          <View style={styles.chips}>
            <Chip label={rarityLabel} color={rarity.badgeColor} bg={rarity.badgeBg} />
            <Chip label={typeLabel}   color="#7C3AED"           bg="#EDE9FE" />
          </View>

          <Text style={styles.desc} numberOfLines={2}>{description}</Text>

          {!isParent && (
            <View style={[styles.ctaBar, canAfford ? styles.ctaBarActive : styles.ctaBarDisabled]}>
              <Text style={[styles.ctaText, !canAfford && styles.ctaTextDisabled]}>
                {reward.redeeming
                  ? 'Получаем...'
                  : canAfford
                  ? 'Обменять на награду'
                  : `Нужно ещё ${reward.points_cost - currentPoints} ★`}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  inner: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  blobWrap: { position: 'absolute', right: -10, top: -10, zIndex: 0 },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 7 },
  name: { fontWeight: '800', fontSize: 15, color: '#1E1B4B', lineHeight: 20, flex: 1 },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 },
  chip: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  chipText: { fontWeight: '700', fontSize: 11 },
  desc: { fontWeight: '600', fontSize: 12, color: '#6B7280', lineHeight: 18 },
  costBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1,
  },
  costText: { fontWeight: '800', fontSize: 13 },
  ctaBar: { marginTop: 12, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  ctaBarActive:   { backgroundColor: '#7C3AED' },
  ctaBarDisabled: { backgroundColor: '#EDE9FE' },
  ctaText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  ctaTextDisabled: { color: '#9CA3AF' },
})
