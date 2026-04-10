import { useEffect } from 'react'
import { Sparkles, Trophy } from 'lucide-react-native'
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import RewardCard from '../components/RewardCard'
import ScreenBackground from '../components/ScreenBackground'
import { useFamilyContext } from '../context/FamilyContext'
import { useTabBar } from '../context/TabBarContext'
import { showError, showSuccess } from '../lib/toast'
import { colors, radius, shadows, spacing, typography } from '../theme'

const STATIC_REWARDS = [
  {
    id: 'movie-night',
    icon: '🍿',
    title: 'Вечер кино',
    description: 'Выбери фильм и проведи семейный вечер с вкусняшками.',
    points_cost: 60,
    type: 'privilege',
    rarity: 'common',
    rarity_label: 'Common',
  },
  {
    id: 'sweet-treat',
    icon: '🍩',
    title: 'Любимое лакомство',
    description: 'Сладкий бонус или десерт по выбору.',
    points_cost: 35,
    type: 'item',
    rarity: 'rare',
    rarity_label: 'Rare',
  },
  {
    id: 'skip-cleaning',
    icon: '🪄',
    title: 'Карта отмены уборки',
    description: 'Можно один раз пропустить дежурную уборку без штрафа.',
    points_cost: 95,
    type: 'artifact',
    rarity: 'epic',
    rarity_label: 'Epic',
    duration_hours: 24,
  },
  {
    id: 'game-time',
    icon: '🎮',
    title: 'Дополнительное время на игры',
    description: 'Еще 30 минут любимой игры или мультфильмов.',
    points_cost: 50,
    type: 'privilege',
    rarity: 'rare',
    rarity_label: 'Rare',
  },
  {
    id: 'small-gift',
    icon: '🎁',
    title: 'Небольшой подарок',
    description: 'Сюрприз, игрушка или что-то приятное от родителей.',
    points_cost: 120,
    type: 'item',
    rarity: 'epic',
    rarity_label: 'Epic',
  },
  {
    id: 'golden-choice',
    icon: '👑',
    title: 'Корона выбора дня',
    description: 'Легендарная награда: можно выбрать главное семейное занятие на день.',
    points_cost: 180,
    type: 'privilege',
    rarity: 'legendary',
    rarity_label: 'Legendary',
  },
]

export default function RewardsScreen() {
  const { currentMembership, isParent, isLoading: contextLoading, refresh } = useFamilyContext()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const { handleScroll, show } = useTabBar()
  const currentPoints = currentMembership?.points || 0

  useEffect(() => {
    show()
  }, [show])

  const redeemMutation = useMutation({
    mutationFn: async reward => {
      if (!currentMembership?.id) throw new Error('Профиль участника не найден')
      if (currentPoints < reward.points_cost) throw new Error('Недостаточно баллов')

      await apiClient.updateFamilyMember(currentMembership.id, {
        points: currentPoints - reward.points_cost,
      })
    },
    onSuccess: (_, reward) => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] })
      refresh()
      showSuccess(`Получено: ${reward.title}`)
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
        contentContainerStyle={[styles.list, { paddingTop: insets.top + 12, paddingBottom: 132 }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={typography.caption}>Игровые награды</Text>
                <Text style={typography.hero}>Магазин</Text>
                <Text style={[typography.subtitle, { marginTop: 6 }]}> 
                  {isParent ? 'Каталог наград, которые дети открывают через задания' : `У вас ${currentPoints} XP`}
                </Text>
              </View>
              <View style={styles.pointsCard}>
                <Text style={styles.pointsValue}>{currentPoints}</Text>
              </View>
            </View>

            <View style={[styles.infoCard, shadows.card]}>
              <View style={styles.infoIconWrap}>
                {isParent ? <Trophy size={18} color={colors.primary} /> : <Sparkles size={18} color={colors.primary} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>{isParent ? 'Система мотивации' : 'Обмен XP на награды'}</Text>
                <Text style={styles.infoText}>
                  {isParent
                    ? 'За задания дети получают XP. Затем они обменивают их на предметы, артефакты и привилегии.'
                    : 'Выполняйте задачи, копите XP и открывайте более редкие награды.'}
                </Text>
              </View>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <RewardCard
            reward={item}
            currentPoints={currentPoints}
            isParent={isParent}
            onRedeem={reward => redeemMutation.mutate(reward)}
          />
        )}
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
    minWidth: 66,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.full,
    paddingHorizontal: 14,
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
})
