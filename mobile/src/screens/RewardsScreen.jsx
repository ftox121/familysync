import { Gift, Sparkles, Star, Trophy } from 'lucide-react-native'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/apiClient'
import ScreenBackground from '../components/ScreenBackground'
import { useFamilyContext } from '../context/FamilyContext'
import { showError, showSuccess } from '../lib/toast'
import { colors, radius, shadows, spacing, typography } from '../theme'

const STATIC_REWARDS = [
  {
    id: 'movie-night',
    icon: '🍿',
    title: 'Вечер кино',
    description: 'Ребенок выбирает фильм и получает семейный вечер с вкусняшками.',
    points: 60,
    accent: '#f59e0b',
  },
  {
    id: 'sweet-treat',
    icon: '🍩',
    title: 'Любимое лакомство',
    description: 'Небольшой сладкий приз или десерт по выбору.',
    points: 35,
    accent: '#ec4899',
  },
  {
    id: 'park-trip',
    icon: '🎡',
    title: 'Поход в парк',
    description: 'Дополнительная прогулка, аттракционы или мороженое в выходной день.',
    points: 90,
    accent: '#10b981',
  },
  {
    id: 'game-time',
    icon: '🎮',
    title: 'Дополнительное время на игры',
    description: 'Еще 30 минут любимой игры или мультфильмов.',
    points: 50,
    accent: '#6366f1',
  },
  {
    id: 'small-gift',
    icon: '🎁',
    title: 'Небольшой подарок',
    description: 'Сюрприз, игрушка или что-то приятное от родителей.',
    points: 120,
    accent: '#8b5cf6',
  },
  {
    id: 'choose-day',
    icon: '🌟',
    title: 'Право выбрать семейное занятие',
    description: 'Ребенок решает, как провести одно семейное время вместе.',
    points: 140,
    accent: '#06b6d4',
  },
]

export default function RewardsScreen() {
  const { family, currentMembership, isParent, isLoading: contextLoading, refresh } = useFamilyContext()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const currentPoints = currentMembership?.points || 0

  const redeemMutation = useMutation({
    mutationFn: async reward => {
      if (!currentMembership?.id) throw new Error('Профиль участника не найден')
      if (currentPoints < reward.points) throw new Error('Недостаточно баллов')

      await apiClient.updateFamilyMember(currentMembership.id, {
        points: currentPoints - reward.points,
      })

      if (family?.id) {
        await apiClient.createNotification({
          family_id: family.id,
          user_email: family.owner_email,
          title: 'Ребенок получил награду',
          message: `${currentMembership.display_name} обменял баллы на «${reward.title}»`,
          type: 'achievement',
        })
      }
    },
    onSuccess: (_, reward) => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      refresh()
      showSuccess(`Награда «${reward.title}» получена!`)
    },
    onError: error => showError(error?.message || 'Не удалось получить награду'),
  })

  if (contextLoading) {
    return (
      <ScreenBackground>
        <View style={[styles.center, { paddingTop: insets.top }]}> 
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenBackground>
    )
  }

  return (
    <ScreenBackground>
      <FlatList
        data={STATIC_REWARDS}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingTop: insets.top + 12, paddingBottom: 132 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={typography.caption}>Магазин наград</Text>
                <Text style={typography.hero}>Награды</Text>
                <Text style={[typography.subtitle, { marginTop: 6 }]}>
                  {isParent
                    ? 'Фиксированный каталог подарков за выполненные задачи'
                    : `У вас ${currentPoints} баллов`}
                </Text>
              </View>
              <View style={styles.pointsCard}>
                <Star size={16} color={colors.amber} fill={colors.amber} />
                <Text style={styles.pointsValue}>{currentPoints}</Text>
              </View>
            </View>

            <View style={[styles.infoCard, shadows.card]}>
              <View style={styles.infoIconWrap}>
                {isParent ? <Trophy size={18} color={colors.primary} /> : <Sparkles size={18} color={colors.primary} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>{isParent ? 'Как это работает' : 'Как получить награду'}</Text>
                <Text style={styles.infoText}>
                  {isParent
                    ? 'Дети выполняют задачи, накапливают баллы и обменивают их на готовые семейные подарки из этого каталога.'
                    : 'Выбирайте награду из списка и обменивайте накопленные баллы на приятные подарки.'}
                </Text>
              </View>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const enough = currentPoints >= item.points
          return (
            <View style={[styles.card, shadows.card]}>
              <View style={[styles.cardIcon, { backgroundColor: `${item.accent}18` }]}>
                <Text style={styles.cardEmoji}>{item.icon}</Text>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={styles.costBadge}>
                    <Star size={13} color={colors.amber} fill={colors.amber} />
                    <Text style={styles.costText}>{item.points}</Text>
                  </View>
                </View>

                <Text style={styles.cardDesc}>{item.description}</Text>

                {isParent ? (
                  <View style={styles.parentHint}>
                    <Gift size={14} color={colors.primary} />
                    <Text style={styles.parentHintText}>Подарок доступен детям после накопления нужного количества баллов</Text>
                  </View>
                ) : (
                  <Pressable
                    disabled={!enough || redeemMutation.isPending}
                    onPress={() => redeemMutation.mutate(item)}
                    style={({ pressed }) => [
                      styles.redeemBtn,
                      enough ? styles.redeemBtnActive : styles.redeemBtnDisabled,
                      pressed && enough && { opacity: 0.92 },
                    ]}
                  >
                    <Text style={[styles.redeemText, !enough && styles.redeemTextDisabled]}>
                      {enough ? 'Получить награду' : `Нужно еще ${item.points - currentPoints} баллов`}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          )
        }}
      />
    </ScreenBackground>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: spacing.screen },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  pointsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  pointsValue: { fontSize: 14, fontWeight: '800', color: colors.text },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1.5,
    borderColor: colors.outline,
    marginBottom: 14,
  },
  infoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 3 },
  infoText: { fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: colors.outline,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardEmoji: { fontSize: 28 },
  cardBody: { flex: 1 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.text },
  cardDesc: { fontSize: 13, lineHeight: 19, color: colors.textSecondary, marginTop: 6 },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.amberSoft,
  },
  costText: { fontSize: 12, fontWeight: '800', color: colors.amber },
  redeemBtn: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeemBtnActive: { backgroundColor: colors.primary },
  redeemBtnDisabled: { backgroundColor: colors.muted },
  redeemText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  redeemTextDisabled: { color: colors.textMuted },
  parentHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
  },
  parentHintText: { flex: 1, fontSize: 12, lineHeight: 18, color: colors.textSecondary },
})
