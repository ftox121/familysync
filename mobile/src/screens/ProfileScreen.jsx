import { useEffect, useRef, useState } from 'react'
import * as Clipboard from 'expo-clipboard'
import { LinearGradient } from 'expo-linear-gradient'
import { BarChart3, Check, Copy, LogOut, Pencil, Trash2, Users, X } from 'lucide-react-native'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { apiClient } from '../api/apiClient'
import { GamificationService } from '../domain/gamification/GamificationService'
import LeaderBoard from '../components/LeaderBoard'
import MemberAvatar from '../components/MemberAvatar'
import ScreenBackground from '../components/ScreenBackground'
import { useFamilyContext } from '../context/FamilyContext'
import { useTabBar } from '../context/TabBarContext'
import { ROLE_LABELS, AVATAR_COLORS, AVATAR_PALETTE } from '../lib/utils'
import { ANIMAL_AVATARS } from '../lib/avatars'
import { showSuccess } from '../lib/toast'
import { getStreakData } from '../lib/streakStorage'
import { colors, gradients, radius, shadows, spacing, typography } from '../theme'

// ─── Animation hooks ──────────────────────────────────────────
function useSlideUp(delay = 0) {
  const y  = useRef(new Animated.Value(22)).current
  const op = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.parallel([
      Animated.timing(y,  { toValue: 0, duration: 380, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(op, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
    ]).start()
  }, [])
  return { transform: [{ translateY: y }], opacity: op }
}

function useLoop({ from = 0, to = 1, duration = 1800, delay = 0, native = true }) {
  const val = useRef(new Animated.Value(from)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(val, { toValue: to,   duration, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
        Animated.timing(val, { toValue: from, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
      ])
    ).start()
  }, [])
  return val
}

// ─── Sparkle ──────────────────────────────────────────────────
function Sparkle({ x, y, size = 11, color, delay = 0 }) {
  const op    = useLoop({ from: 0, to: 1, duration: 800, delay })
  const scale = useLoop({ from: 0.2, to: 1, duration: 800, delay })
  return (
    <Animated.View style={{ position: 'absolute', left: x, top: y, width: size, height: size, opacity: op, transform: [{ scale }] }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 0L13.8 10.2L24 12L13.8 13.8L12 24L10.2 13.8L0 12L10.2 10.2Z" fill={color} />
      </Svg>
    </Animated.View>
  )
}

// ─── Animated avatar glow wrapper ─────────────────────────────
function AnimatedAvatarGlow({ children, size = 56 }) {
  const glowScale = useLoop({ from: 1, to: 1.18, duration: 2200 })
  const glowOp    = useLoop({ from: 0.2, to: 0.55, duration: 2200 })
  const floatY    = useLoop({ from: 0, to: -3, duration: 2600 })
  return (
    <View style={{ width: size + 16, height: size + 16, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute',
        width: size + 8, height: size + 8, borderRadius: (size + 8) / 2,
        backgroundColor: colors.primary,
        opacity: glowOp,
        transform: [{ scale: glowScale }],
      }} />
      <Animated.View style={{ transform: [{ translateY: floatY }] }}>
        {children}
      </Animated.View>
    </View>
  )
}

// ─── Rank badge with animated progress bar ────────────────────
function RankBadge({ tierVm, onPress }) {
  const progW  = useRef(new Animated.Value(0)).current
  const emojiY = useLoop({ from: 0, to: -4, duration: 2000 })
  const pct    = Math.min(100, tierVm.progressPercent ?? 0)

  useEffect(() => {
    Animated.timing(progW, {
      toValue: pct,
      duration: 1000,
      delay: 600,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start()
  }, [pct])

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={rankStyles.wrap}>
      <View style={rankStyles.inner}>
        <Animated.Text style={[rankStyles.emoji, { transform: [{ translateY: emojiY }] }]}>
          {tierVm.tier.icon}
        </Animated.Text>
        <View style={{ flex: 1 }}>
          <Text style={rankStyles.name}>«{tierVm.tier.title}»</Text>
          <Text style={rankStyles.xpLine}>{tierVm.currentXp ?? 0} ★ · {pct}% пути</Text>
          {tierVm.nextTier
            ? <Text style={rankStyles.sub}>Осталось {tierVm.xpToNext} ★ до «{tierVm.nextTier.title}»</Text>
            : <Text style={rankStyles.sub}>Все уровни открыты 🎉</Text>
          }
        </View>
        <Text style={rankStyles.arrow}>›</Text>
      </View>

      <Sparkle x={220} y={4}  color="#A78BFA" delay={0} />
      <Sparkle x={236} y={22} color="#DDD6FE" delay={600} size={9} />

      <View style={rankStyles.track}>
        <Animated.View style={[rankStyles.fill, {
          width: progW.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
        }]}>
          <LinearGradient
            colors={gradients.progress}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </TouchableOpacity>
  )
}

const rankStyles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1.5,
    borderColor: colors.outline,
    marginTop: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  inner:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  emoji:  { fontSize: 22 },
  name:   { fontWeight: '800', fontSize: 15, color: colors.text },
  xpLine: { fontWeight: '700', fontSize: 12, color: colors.primary, marginTop: 2 },
  sub:    { fontWeight: '600', fontSize: 11, color: colors.textMuted, marginTop: 1 },
  arrow:  { fontWeight: '300', fontSize: 22, color: colors.primary, lineHeight: 32 },
  track:  { height: 8, borderRadius: radius.full, backgroundColor: colors.muted, overflow: 'hidden' },
  fill:   { height: '100%', borderRadius: radius.full, overflow: 'hidden' },
})

// ─── Animated stat card ───────────────────────────────────────
function StatCard({ value, label, color, delay = 0 }) {
  const slideStyle = useSlideUp(delay)
  const scale = useRef(new Animated.Value(0.85)).current
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, tension: 120, friction: 8, delay, useNativeDriver: true }).start()
  }, [])
  return (
    <Animated.View style={[styles.statBox, shadows.press, slideStyle, { transform: [{ scale }] }]}>
      <Text style={[styles.statNum, { color }]}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </Animated.View>
  )
}

// ─── Shimmer invite code row ───────────────────────────────────
function ShimmerCodeBox({ code, copied, onCopy }) {
  const shimX = useRef(new Animated.Value(-100)).current
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimX, {
        toValue: 300,
        duration: 2200,
        delay: 1000,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    ).start()
  }, [])
  return (
    <Pressable onPress={onCopy} style={shimStyles.box}>
      <Animated.View style={[shimStyles.shimmer, { transform: [{ translateX: shimX }] }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.codeLabel}>КОД ПРИГЛАШЕНИЯ</Text>
        <Text style={styles.code}>{code}</Text>
      </View>
      {copied ? <Check size={20} color={colors.green} /> : <Copy size={20} color={colors.text} />}
    </Pressable>
  )
}

const shimStyles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.muted,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    gap: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
})

// ─────────────────────────────────────────────────────────────
// MAIN ProfileScreen  — logic identical to original
// ─────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const { user, family, currentMembership, members, tasks, isLoading, isParent, refresh, reloadUser } =
    useFamilyContext()
  const [copied, setCopied] = useState(false)
  const [streakData, setStreakData] = useState({ streakCount: 0, onTimeStreak: 0 })
  const [editVisible, setEditVisible] = useState(false)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('violet')
  const [editAnimal, setEditAnimal] = useState(null)
  const [editSaving, setEditSaving] = useState(false)
  const insets = useSafeAreaInsets()
  const { handleScroll, show } = useTabBar()

  useEffect(() => { show() }, [show])

  useEffect(() => {
    if (user?.email) getStreakData(user.email).then(setStreakData)
  }, [user?.email])

  if (isLoading)
    return (
      <ScreenBackground>
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenBackground>
    )

  const memberXp = currentMembership?.points ?? 0
  const tierVm = { ...GamificationService.getTierForXp(memberXp), currentXp: memberXp }
  const achUnlocked = (() => {
    try {
      const j = JSON.parse(currentMembership?.achievements_json || '[]')
      return Array.isArray(j) ? j : []
    } catch { return [] }
  })()
  const myTasks    = tasks.filter(t => t.assigned_to === user?.email)
  const myCompleted = myTasks.filter(t => t.status === 'completed').length

  const handleCopy = async () => {
    const code = family?.invite_code ?? ''
    try {
      await Clipboard.setStringAsync(code)
      setCopied(true)
      showSuccess('Код скопирован')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      Alert.alert('Код приглашения', code || '—')
    }
  }

  const openEditModal = () => {
    setEditName(currentMembership?.display_name ?? '')
    setEditColor(currentMembership?.avatar_color ?? 'violet')
    setEditAnimal(currentMembership?.animal_id ?? null)
    setEditVisible(true)
  }

  const handleSaveProfile = async () => {
    if (!editName.trim()) return
    setEditSaving(true)
    try {
      await apiClient.updateFamilyMember(currentMembership.id, {
        display_name: editName.trim(),
        avatar_color: editColor,
        animal_id: editAnimal,
      })
      await refresh()
      setEditVisible(false)
      showSuccess('Профиль обновлён')
    } catch {
      Alert.alert('Ошибка', 'Не удалось сохранить профиль')
    } finally {
      setEditSaving(false)
    }
  }

  const handleRemoveMember = (member) => {
    Alert.alert(
      'Удалить участника?',
      `${member.display_name} будет удалён из семьи.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.removeFamilyMember(family.id, member.id)
              await refresh()
              showSuccess(`${member.display_name} удалён из семьи`)
            } catch (e) {
              Alert.alert('Ошибка', e?.message || 'Не удалось удалить участника')
            }
          },
        },
      ]
    )
  }

  const handleLogout = () => {
    Alert.alert('Сменить локальный аккаунт?', 'Будет создан новый локальный профиль.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: async () => {
          await apiClient.logout()
          reloadUser()
          refresh()
        },
      },
    ])
  }

  // slide-up delays for each section
  const s0  = useSlideUp(0)
  const s80 = useSlideUp(80)
  const s160 = useSlideUp(160)
  const s240 = useSlideUp(240)
  const s300 = useSlideUp(300)
  const s360 = useSlideUp(360)
  const s420 = useSlideUp(420)

  return (
    <ScreenBackground>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 132 }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <Animated.View style={s0}>
          <Text style={typography.caption}>Ваш аккаунт</Text>
          <Text style={[typography.hero, { marginTop: 4, marginBottom: 4 }]}>Профиль</Text>
          <Text style={[typography.subtitle, { marginBottom: 18 }]}>Прогресс, семья и настройки</Text>
        </Animated.View>

        {/* User card */}
        <Animated.View style={[styles.card, shadows.card, s80, { marginBottom: 16 }]}>
          <View style={styles.userRow}>
            <AnimatedAvatarGlow size={56}>
              <MemberAvatar
                name={currentMembership?.display_name ?? user?.full_name}
                color={currentMembership?.avatar_color}
                animalId={currentMembership?.animal_id}
                size="xl"
              />
            </AnimatedAvatarGlow>
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { flex: 1 }]}>
                  {currentMembership?.display_name ?? user?.full_name}
                </Text>
                <Pressable style={styles.editBtn} onPress={openEditModal}>
                  <Pencil size={15} color={colors.primary} />
                </Pressable>
              </View>
              <Text style={styles.roleText}>
                {ROLE_LABELS[currentMembership?.role] ?? 'Участник'}
              </Text>
            </View>
          </View>

          <RankBadge
            tierVm={tierVm}
            onPress={() => navigation.navigate('RankDetail', { rankIndex: 0, userXP: currentMembership?.points ?? 0 })}
          />
        </Animated.View>

        {/* Stats */}
        <Animated.View style={[styles.statsGrid, s160]}>
          <StatCard value={myTasks.length}                 label="Всего задач" color={colors.primary} delay={160} />
          <StatCard value={myCompleted}                    label="Выполнено"   color={colors.green}   delay={220} />
          <StatCard value={currentMembership?.points ?? 0} label="Баллов"      color={colors.amber}   delay={280} />
        </Animated.View>

        {/* Family card */}
        <Animated.View style={[styles.card, shadows.card, s240, { marginBottom: 16 }]}>
          <View style={styles.familyTop}>
            <View style={styles.familyTitle}>
              <Users size={18} color={colors.text} />
              <Text style={styles.familyName}>{family?.name}</Text>
            </View>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{members.length} уч.</Text>
            </View>
          </View>

          <ShimmerCodeBox code={family?.invite_code} copied={copied} onCopy={handleCopy} />

          <View style={styles.members}>
            {members.map(m => (
              <View key={m.id} style={styles.memberChip}>
                <MemberAvatar name={m.display_name} color={m.avatar_color} animalId={m.animal_id} size="sm" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{m.display_name}</Text>
                  <Text style={styles.memberRole}>{ROLE_LABELS[m.role]}</Text>
                </View>
                {isParent && m.user_email !== user?.email && (
                  <Pressable style={styles.removeMemberBtn} onPress={() => handleRemoveMember(m)}>
                    <Trash2 size={14} color={colors.red} />
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Analytics — always accessible */}
        <Animated.View style={s300}>
          <Pressable
            style={({ pressed }) => [styles.analyticsBtn, shadows.card, pressed && { opacity: 0.92 }]}
            onPress={() => navigation.navigate('Analytics')}
          >
            <BarChart3 size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.analyticsTitle}>Аналитика семьи</Text>
              <Text style={styles.analyticsSub}>Просрочки, графики, рейтинг</Text>
            </View>
            <Text style={styles.analyticsChev}>›</Text>
          </Pressable>
        </Animated.View>

        {/* Achievements */}
        {(() => {
          const totalCompleted = currentMembership?.tasks_completed ?? 0
          const streakCount    = streakData.streakCount
          const onTimeStreak   = streakData.onTimeStreak
          const ctx            = { totalCompleted, streakCount, onTimeStreak }
          const allAchievements = Object.values(GamificationService.ACHIEVEMENTS)
          return (
            <Animated.View style={[styles.card, shadows.card, s360, { marginBottom: 16 }]}>
              <View style={styles.achHeader}>
                <Text style={styles.achTitle}>Достижения</Text>
                <View style={styles.achCountPill}>
                  <Text style={styles.achCountText}>{achUnlocked.length}/{allAchievements.length}</Text>
                </View>
              </View>
              {allAchievements.map((def, i) => {
                const unlocked = achUnlocked.includes(def.id)
                const current  = Math.min(def.goal, ctx[def.progressKey] ?? 0)
                const pct      = Math.min(100, Math.round((current / def.goal) * 100))
                return (
                  <View key={def.id} style={[styles.achRow, !unlocked && styles.achRowLocked]}>
                    <View style={[styles.achIconWrap, unlocked && styles.achIconWrapUnlocked]}>
                      <Text style={styles.achIcon}>{unlocked ? def.icon : '🔒'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.achRowTop}>
                        <Text style={[styles.achRowTitle, !unlocked && styles.achRowTitleLocked]}>{def.title}</Text>
                        {unlocked
                          ? <Text style={styles.achDoneLabel}>Получено</Text>
                          : <Text style={styles.achProgressLabel}>{current}/{def.goal}</Text>
                        }
                      </View>
                      <Text style={styles.achDesc}>{def.description}</Text>
                      {!unlocked && (
                        <View style={styles.achTrack}>
                          <View style={[styles.achFill, { width: `${pct}%` }]} />
                        </View>
                      )}
                    </View>
                  </View>
                )
              })}
            </Animated.View>
          )
        })()}

        {/* Leaderboard */}
        <Animated.View style={s420}>
          <LeaderBoard members={members} />
        </Animated.View>

        {/* Logout */}
        <Animated.View style={[s420, { marginTop: 8 }]}>
          <Pressable
            style={({ pressed }) => [styles.logout, pressed && { opacity: 0.88 }]}
            onPress={handleLogout}
          >
            <LogOut size={18} color={colors.textSecondary} />
            <Text style={styles.logoutText}>Выйти</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Edit profile modal — unchanged */}
      <Modal visible={editVisible} animationType="slide" transparent onRequestClose={() => setEditVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditVisible(false)}>
          <Pressable style={[styles.modalSheet, { paddingBottom: insets.bottom + 24 }]} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Редактировать профиль</Text>
              <Pressable onPress={() => setEditVisible(false)}>
                <X size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.modalLabel}>Имя</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Ваше имя"
              placeholderTextColor={colors.textMuted}
              maxLength={40}
            />

            <Text style={styles.modalLabel}>Цвет аватара</Text>
            <View style={styles.colorRow}>
              {AVATAR_COLORS.map(c => (
                <Pressable
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: AVATAR_PALETTE[c]?.bg ?? '#ede9fe' },
                    editColor === c && styles.colorDotActive,
                  ]}
                  onPress={() => setEditColor(c)}
                />
              ))}
            </View>

            <Text style={styles.modalLabel}>Животное</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.animalScroll}>
              <Pressable
                style={[styles.animalChip, editAnimal === null && styles.animalChipActive]}
                onPress={() => setEditAnimal(null)}
              >
                <Text style={styles.animalEmoji}>🔤</Text>
                <Text style={styles.animalName}>Буква</Text>
              </Pressable>
              {ANIMAL_AVATARS.map(a => {
                const memberXp = currentMembership?.points ?? 0
                const isLocked = a.minXp > 0 && memberXp < a.minXp
                return (
                  <Pressable
                    key={a.id}
                    style={[
                      styles.animalChip,
                      editAnimal === a.id && styles.animalChipActive,
                      isLocked && styles.animalChipLocked,
                    ]}
                    onPress={() => {
                      if (isLocked) {
                        Alert.alert('🔒 Заблокировано', `Откроется при ${a.minXp} XP`)
                        return
                      }
                      setEditAnimal(a.id)
                    }}
                  >
                    <Text style={[styles.animalEmoji, isLocked && { opacity: 0.35 }]}>{a.emoji}</Text>
                    <Text style={[styles.animalName, isLocked && { color: colors.textMuted }]}>
                      {isLocked ? '🔒' : a.name}
                    </Text>
                  </Pressable>
                )
              })}
            </ScrollView>

            <Pressable
              style={[styles.saveBtn, editSaving && { opacity: 0.6 }]}
              onPress={handleSaveProfile}
              disabled={editSaving}
            >
              {editSaving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveBtnText}>Сохранить</Text>
              }
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenBackground>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: spacing.screen },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    padding: 22,
    borderWidth: 1.5,
    borderColor: colors.outline,
  },
  userRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  userInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 19, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  editBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: radius.full,
    marginTop: 10,
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.2)',
  },
  roleText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statBox: {
    flex: 1,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.md,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.outline,
  },
  statNum: { fontSize: 24, fontWeight: '800', color: colors.primary },
  statLbl: { fontSize: 10, color: colors.textMuted, marginTop: 6, textAlign: 'center', fontWeight: '700' },
  familyTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  familyTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  familyName: { fontSize: 14, fontWeight: '700', color: colors.text },
  countPill: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1, borderColor: colors.border,
  },
  countPillText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  codeLabel: { fontSize: 10, color: colors.textMuted, letterSpacing: 0.5, fontWeight: '600' },
  code: { fontSize: 20, fontWeight: '700', letterSpacing: 4, marginTop: 4, color: colors.text },
  members: { flexDirection: 'column', gap: 8 },
  memberChip: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.muted,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
  },
  memberName: { fontSize: 14, fontWeight: '700', color: colors.text },
  memberRole: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  removeMemberBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center',
  },
  analyticsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 18,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.outline,
    marginBottom: 16,
  },
  analyticsTitle: { fontSize: 16, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },
  analyticsSub: { fontSize: 12, color: colors.textSecondary, marginTop: 3, fontWeight: '500' },
  analyticsChev: { fontSize: 24, color: colors.textMuted, fontWeight: '300' },
  artifactsTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  artifactsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  artifactsTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  artifactsCountPill: {
    minWidth: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  artifactsCountText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  artifactsEmpty: {
    padding: 14, borderRadius: radius.md,
    backgroundColor: colors.muted,
    borderWidth: 1, borderColor: colors.outline,
  },
  artifactsEmptyTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 4 },
  artifactsEmptyText: { fontSize: 12, lineHeight: 18, color: colors.textSecondary },
  artifactsList: { gap: 10 },
  artifactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1, borderColor: colors.outline,
  },
  artifactIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.surfaceStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  artifactIcon: { fontSize: 20 },
  artifactName: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 4 },
  artifactMetaText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  achHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  achTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  achCountPill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1, borderColor: colors.outline,
  },
  achCountText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  achRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: colors.outline,
  },
  achRowLocked: { opacity: 0.55 },
  achIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.muted,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.outline,
  },
  achIconWrapUnlocked: { backgroundColor: colors.primaryMuted, borderColor: 'rgba(192,132,252,0.3)' },
  achIcon: { fontSize: 20 },
  achRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  achRowTitle: { fontSize: 13, fontWeight: '800', color: colors.text },
  achRowTitleLocked: { color: colors.textSecondary },
  achDoneLabel: { fontSize: 11, fontWeight: '700', color: colors.green },
  achProgressLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  achDesc: { fontSize: 11, color: colors.textMuted, lineHeight: 16, marginBottom: 6 },
  achTrack: {
    height: 6, backgroundColor: colors.muted, borderRadius: 3,
    overflow: 'hidden', borderWidth: 1, borderColor: colors.outline,
  },
  achFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  logout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.outline,
    backgroundColor: colors.surfaceStrong,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  modalLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 8, letterSpacing: 0.5 },
  modalInput: {
    backgroundColor: colors.muted,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.outline,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: colors.text, marginBottom: 18,
  },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  colorDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  colorDotActive: { borderColor: colors.primary, transform: [{ scale: 1.15 }] },
  animalScroll: { marginBottom: 20 },
  animalChip: {
    alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 12, backgroundColor: colors.muted,
    borderWidth: 1.5, borderColor: 'transparent',
    marginRight: 8, minWidth: 56,
  },
  animalChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  animalChipLocked: { opacity: 0.5, borderColor: colors.outline },
  animalEmoji: { fontSize: 22 },
  animalName: { fontSize: 9, color: colors.textMuted, marginTop: 2, fontWeight: '600' },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
})
