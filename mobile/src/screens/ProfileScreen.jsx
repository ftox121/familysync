import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as Clipboard from 'expo-clipboard'
import { LinearGradient } from 'expo-linear-gradient'
import { BarChart3, Check, Clock3, Copy, LogOut, Sparkles, Users } from 'lucide-react-native'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
import { ROLE_LABELS } from '../lib/utils'
import { showSuccess } from '../lib/toast'
import { colors, gradients, radius, shadows, spacing, typography } from '../theme'

export default function ProfileScreen({ navigation }) {
  const { user, family, currentMembership, members, tasks, isLoading, refresh, reloadUser } =
    useFamilyContext()
  const [copied, setCopied] = useState(false)
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
  const activeArtifacts = rewardClaims.filter(claim => {
    if (claim.user_email !== user?.email) return false
    if (claim.type !== 'artifact') return false
    if (claim.status !== 'active') return false
    if (!claim.active_until) return false
    return new Date(claim.active_until).getTime() > Date.now()
  })

  const formatRemaining = iso => {
    const diff = new Date(iso).getTime() - Date.now()
    if (diff <= 0) return 'Истек'
    const totalMinutes = Math.ceil(diff / 60000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (hours <= 0) return `${minutes} мин`
    return `${hours} ч ${minutes} мин`
  }

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
            <Text style={styles.name}>{currentMembership?.display_name ?? user?.full_name}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>
                {ROLE_LABELS[currentMembership?.role] ?? 'Участник'}
              </Text>
            </View>
            <View style={styles.levelRow}>
              <Text style={styles.levelLabel}>«{tierVm.tier.title}»</Text>
              <Text style={styles.points}>⭐ {currentMembership?.points ?? 0} XP</Text>
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
              <View>
                <Text style={styles.memberName}>{m.display_name}</Text>
                <Text style={styles.memberRole}>{ROLE_LABELS[m.role]}</Text>
              </View>
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
            <Text style={styles.artifactsTitle}>Активные артефакты</Text>
          </View>
          <View style={styles.artifactsCountPill}>
            <Text style={styles.artifactsCountText}>{activeArtifacts.length}</Text>
          </View>
        </View>

        {activeArtifacts.length === 0 ? (
          <View style={styles.artifactsEmpty}>
            <Text style={styles.artifactsEmptyTitle}>Сейчас нет активных эффектов</Text>
            <Text style={styles.artifactsEmptyText}>
              Когда вы активируете артефакт, он появится здесь с таймером действия.
            </Text>
          </View>
        ) : (
          <View style={styles.artifactsList}>
            {activeArtifacts.map(claim => (
              <View key={claim.id} style={styles.artifactRow}>
                <View style={styles.artifactIconWrap}>
                  <Text style={styles.artifactIcon}>{claim.icon || '🪄'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.artifactName}>{claim.title}</Text>
                  <View style={styles.artifactMetaRow}>
                    <Clock3 size={12} color={colors.primary} />
                    <Text style={styles.artifactMetaText}>Осталось: {formatRemaining(claim.active_until)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {achUnlocked.length > 0 && (
        <View style={[styles.card, shadows.card]}>
          <Text style={styles.achTitle}>Достижения</Text>
          {achUnlocked.map(id => {
            const def = GamificationService.ACHIEVEMENTS[id]
            return def ? (
              <Text key={id} style={styles.achLine}>
                🏅 {def.title} — {def.description}
              </Text>
            ) : (
              <Text key={id} style={styles.achLine}>
                {id}
              </Text>
            )
          })}
        </View>
      )}

      <LeaderBoard members={members} />

      <Pressable
        style={({ pressed }) => [styles.logout, pressed && { opacity: 0.88 }]}
        onPress={handleLogout}
      >
        <LogOut size={18} color={colors.textSecondary} />
        <Text style={styles.logoutText}>Выйти</Text>
      </Pressable>
      </ScrollView>
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
  name: { fontSize: 19, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
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
  members: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.muted,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  memberName: { fontSize: 12, fontWeight: '700', color: colors.text },
  memberRole: { fontSize: 10, color: colors.textMuted },
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
  achTitle: { fontSize: 15, fontWeight: '800', marginBottom: 10, color: colors.text },
  achLine: { fontSize: 13, color: colors.textSecondary, marginTop: 8, lineHeight: 20, fontWeight: '500' },
})
