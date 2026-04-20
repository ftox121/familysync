import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as Clipboard from 'expo-clipboard'
import { LinearGradient } from 'expo-linear-gradient'
import { BarChart3, Check, Copy, LogOut, Pencil, Sparkles, Trash2, Users, X } from 'lucide-react-native'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
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

  const { data: rewardClaims = [] } = useQuery({
    queryKey: ['reward-claims', family?.id],
    queryFn: () => apiClient.getRewardClaims(family.id),
    enabled: !!family?.id,
    refetchInterval: 30_000,
  })

  useEffect(() => {
    show()
  }, [show])

  useEffect(() => {
    if (user?.email) {
      getStreakData(user.email).then(setStreakData)
    }
  }, [user?.email])

  if (isLoading)
    return (
      <ScreenBackground>
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenBackground>
    )

  const tierVm = GamificationService.getTierForXp(currentMembership?.points ?? 0)
  const achUnlocked = (() => {
    try {
      const j = JSON.parse(currentMembership?.achievements_json || '[]')
      return Array.isArray(j) ? j : []
    } catch {
      return []
    }
  })()
  const myTasks = tasks.filter(t => t.assigned_to === user?.email)
  const myCompleted = myTasks.filter(t => t.status === 'completed').length
  const activeRewards = rewardClaims.filter(claim =>
    claim.user_email === user?.email && (claim.status === 'approved' || claim.status === 'active')
  )

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

  return (
    <ScreenBackground>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: 132 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Text style={typography.caption}>Ваш аккаунт</Text>
        <Text style={[typography.hero, { marginTop: 4, marginBottom: 4 }]}>Профиль</Text>
        <Text style={[typography.subtitle, { marginBottom: 18 }]}>Прогресс, семья и настройки</Text>

        <View style={[styles.card, shadows.card]}>
        <View style={styles.userRow}>
          <MemberAvatar
            name={currentMembership?.display_name ?? user?.full_name}
            color={currentMembership?.avatar_color}
            animalId={currentMembership?.animal_id}
            size="xl"
          />
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { flex: 1 }]}>{currentMembership?.display_name ?? user?.full_name}</Text>
              <Pressable style={styles.editBtn} onPress={openEditModal}>
                <Pencil size={15} color={colors.primary} />
              </Pressable>
            </View>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>
                {ROLE_LABELS[currentMembership?.role] ?? 'Участник'}
              </Text>
            </View>
            <View style={styles.levelRow}>
              <Text style={styles.levelLabel}>«{tierVm.tier.title}»</Text>
              <Text style={styles.points}>{tierVm.tier.icon} {currentMembership?.points ?? 0} XP</Text>
            </View>
            <View style={styles.track}>
              <LinearGradient
                colors={gradients.progress}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.fill, { width: `${Math.min(100, tierVm.progressPercent)}%` }]}
              />
            </View>
            <Text style={styles.nextLevel}>
              {tierVm.nextTier
                ? `До «${tierVm.nextTier.title}»: ${tierVm.xpToNext} XP`
                : 'Открыты все уровни геймификации'}
            </Text>
          </View>
        </View>
      </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statBox, shadows.press]}>
            <Text style={styles.statNum}>{myTasks.length}</Text>
            <Text style={styles.statLbl}>Всего задач</Text>
          </View>
          <View style={[styles.statBox, shadows.press]}>
            <Text style={[styles.statNum, { color: colors.green }]}>{myCompleted}</Text>
            <Text style={styles.statLbl}>Выполнено</Text>
          </View>
          <View style={[styles.statBox, shadows.press]}>
            <Text style={[styles.statNum, { color: colors.amber }]}>
              {currentMembership?.points ?? 0}
            </Text>
            <Text style={styles.statLbl}>Баллов</Text>
          </View>
        </View>

        <View style={[styles.card, shadows.card]}>
        <View style={styles.familyTop}>
          <View style={styles.familyTitle}>
            <Users size={18} color={colors.text} />
            <Text style={styles.familyName}>{family?.name}</Text>
          </View>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{members.length} уч.</Text>
          </View>
        </View>

        <View style={styles.codeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.codeLabel}>КОД ПРИГЛАШЕНИЯ</Text>
            <Text style={styles.code}>{family?.invite_code}</Text>
          </View>
          <Pressable style={styles.copyBtn} onPress={handleCopy}>
            {copied ? (
              <Check size={20} color={colors.green} />
            ) : (
              <Copy size={20} color={colors.text} />
            )}
          </Pressable>
        </View>

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
      </View>

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

      <View style={[styles.card, shadows.card]}>
        <View style={styles.artifactsTop}>
          <View style={styles.artifactsTitleRow}>
            <Sparkles size={18} color={colors.primary} />
            <Text style={styles.artifactsTitle}>Активные награды</Text>
          </View>
          <View style={styles.artifactsCountPill}>
            <Text style={styles.artifactsCountText}>{activeRewards.length}</Text>
          </View>
        </View>

        {activeRewards.length === 0 ? (
          <View style={styles.artifactsEmpty}>
            <Text style={styles.artifactsEmptyTitle}>Нет активных наград</Text>
            <Text style={styles.artifactsEmptyText}>
              Получённые и одобренные родителем награды появятся здесь.
            </Text>
          </View>
        ) : (
          <View style={styles.artifactsList}>
            {activeRewards.map(claim => (
              <View key={claim.id} style={styles.artifactRow}>
                <View style={styles.artifactIconWrap}>
                  <Text style={styles.artifactIcon}>{claim.icon || '🎁'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.artifactName}>{claim.title}</Text>
                  <Text style={styles.artifactMetaText}>
                    {claim.type === 'privilege' ? 'Привилегия' : 'Предмет'} · активна
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {(() => {
        const totalCompleted = currentMembership?.tasks_completed ?? 0
        const streakCount = streakData.streakCount
        const onTimeStreak = streakData.onTimeStreak
        const ctx = { totalCompleted, streakCount, onTimeStreak }
        const allAchievements = Object.values(GamificationService.ACHIEVEMENTS)
        return (
          <View style={[styles.card, shadows.card]}>
            <View style={styles.achHeader}>
              <Text style={styles.achTitle}>Достижения</Text>
              <View style={styles.achCountPill}>
                <Text style={styles.achCountText}>{achUnlocked.length}/{allAchievements.length}</Text>
              </View>
            </View>
            {allAchievements.map(def => {
              const unlocked = achUnlocked.includes(def.id)
              const current = Math.min(def.goal, ctx[def.progressKey] ?? 0)
              const pct = Math.min(100, Math.round((current / def.goal) * 100))
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
          </View>
        )
      })()}

      <LeaderBoard members={members} />

      <Pressable
        style={({ pressed }) => [styles.logout, pressed && { opacity: 0.88 }]}
        onPress={handleLogout}
      >
        <LogOut size={18} color={colors.textSecondary} />
        <Text style={styles.logoutText}>Выйти</Text>
      </Pressable>
      </ScrollView>

      {/* Модалка редактирования профиля */}
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
              {/* Без животного */}
              <Pressable
                style={[styles.animalChip, editAnimal === null && styles.animalChipActive]}
                onPress={() => setEditAnimal(null)}
              >
                <Text style={styles.animalEmoji}>🔤</Text>
                <Text style={styles.animalName}>Буква</Text>
              </Pressable>
              {ANIMAL_AVATARS.map(a => (
                <Pressable
                  key={a.id}
                  style={[styles.animalChip, editAnimal === a.id && styles.animalChipActive]}
                  onPress={() => setEditAnimal(a.id)}
                >
                  <Text style={styles.animalEmoji}>{a.emoji}</Text>
                  <Text style={styles.animalName}>{a.name}</Text>
                </Pressable>
              ))}
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
    marginBottom: 16,
  },
  userRow: { flexDirection: 'row', gap: 18 },
  userInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 19, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  editBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)',
  },
  roleText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
  },
  levelLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  points: { fontSize: 13, fontWeight: '800', color: colors.amber },
  track: {
    height: 12,
    backgroundColor: colors.muted,
    borderRadius: radius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  fill: { height: '100%', borderRadius: radius.full },
  nextLevel: { fontSize: 11, color: colors.textMuted, marginTop: 10, fontWeight: '600' },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  familyTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  familyName: { fontSize: 14, fontWeight: '700', color: colors.text },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countPillText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.muted,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    gap: 12,
  },
  codeLabel: { fontSize: 10, color: colors.textMuted, letterSpacing: 0.5, fontWeight: '600' },
  code: { fontSize: 20, fontWeight: '700', letterSpacing: 4, marginTop: 4 },
  copyBtn: { padding: 8 },
  members: { flexDirection: 'column', gap: 8 },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.muted,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  memberName: { fontSize: 14, fontWeight: '700', color: colors.text },
  memberRole: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  removeMemberBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outline,
    marginTop: 8,
    backgroundColor: colors.surfaceStrong,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  analyticsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.outline,
    marginBottom: 12,
  },
  analyticsTitle: { fontSize: 16, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },
  analyticsSub: { fontSize: 12, color: colors.textSecondary, marginTop: 3, fontWeight: '500' },
  analyticsChev: { fontSize: 24, color: colors.textMuted, fontWeight: '300' },
  artifactsTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  artifactsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  artifactsTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  artifactsCountPill: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artifactsCountText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  artifactsEmpty: {
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  artifactsEmptyTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 4 },
  artifactsEmptyText: { fontSize: 12, lineHeight: 18, color: colors.textSecondary },
  artifactsList: { gap: 10 },
  artifactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  artifactIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artifactIcon: { fontSize: 20 },
  artifactName: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 4 },
  artifactMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  artifactMetaText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  achHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  achTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  achCountPill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.outline,
  },
  achCountText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  achRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.outline,
  },
  achRowLocked: { opacity: 0.55 },
  achIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center',
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
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  modalLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 8, letterSpacing: 0.5 },
  modalInput: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.outline,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 18,
  },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotActive: {
    borderColor: colors.primary,
    transform: [{ scale: 1.15 }],
  },
  animalScroll: { marginBottom: 20 },
  animalChip: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.muted,
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginRight: 8,
    minWidth: 56,
  },
  animalChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  animalEmoji: { fontSize: 22 },
  animalName: { fontSize: 9, color: colors.textMuted, marginTop: 2, fontWeight: '600' },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
})
