import { useEffect, useState } from 'react'
import { Coins, Plus, Sparkles, Trophy, X } from 'lucide-react-native'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import RewardCard from '../components/RewardCard'
import ScreenBackground from '../components/ScreenBackground'
import { apiClient } from '../api/apiClient'
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

const RARITY_OPTIONS = [
  { value: 'common', label: 'Common', color: colors.textSecondary },
  { value: 'rare', label: 'Rare', color: '#1d4ed8' },
  { value: 'epic', label: 'Epic', color: '#7c3aed' },
  { value: 'legendary', label: 'Legendary', color: '#b45309' },
]

const TYPE_OPTIONS = [
  { value: 'item', label: 'Предмет' },
  { value: 'privilege', label: 'Привилегия' },
]

const EMOJI_PRESETS = ['🎁','🍕','🍦','🎮','🎬','🛁','🎨','🚴','⚽','🎤','🏖','🍩','🪀','🐾','🌟','🏆','💎','🎠','🧸','🌈']

export default function RewardsScreen() {
  const { currentMembership, family, isParent, isLoading: contextLoading, refresh } = useFamilyContext()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const { handleScroll, show } = useTabBar()
  const currentPoints = currentMembership?.points || 0

  // Create reward modal state
  const [createVisible, setCreateVisible] = useState(false)
  const [newIcon, setNewIcon] = useState('🎁')
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCost, setNewCost] = useState('50')
  const [newType, setNewType] = useState('item')
  const [newRarity, setNewRarity] = useState('common')
  const [creating, setCreating] = useState(false)

  useEffect(() => { show() }, [show])

  const { data: dbRewards = [] } = useQuery({
    queryKey: ['rewards', family?.id],
    queryFn: () => apiClient.getRewards(family.id),
    enabled: !!family?.id,
    refetchInterval: 15_000,
  })

  const allRewards = [
    ...dbRewards.map(r => ({ ...r, _source: 'db' })),
    ...STATIC_REWARDS.map(r => ({ ...r, _source: 'static' })),
  ]

  const redeemMutation = useMutation({
    mutationFn: async reward => {
      if (!currentMembership?.id) throw new Error('Профиль участника не найден')
      if (currentPoints < reward.points_cost) throw new Error('Недостаточно баллов')
      if (reward._source === 'db') {
        await apiClient.claimReward(reward.id)
      } else {
        await apiClient.updateFamilyMember(currentMembership.id, {
          points: currentPoints - reward.points_cost,
        })
      }
    },
    onSuccess: (_, reward) => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] })
      queryClient.invalidateQueries({ queryKey: ['reward-claims'] })
      refresh()
      showSuccess(`Получено: ${reward.title}`)
    },
    onError: error => showError(error?.message || 'Не удалось получить награду'),
  })

  const openCreate = () => {
    setNewIcon('🎁')
    setNewTitle('')
    setNewDesc('')
    setNewCost('50')
    setNewType('item')
    setNewRarity('common')
    setCreateVisible(true)
  }

  const handleCreate = async () => {
    if (!newTitle.trim()) { showError('Введите название'); return }
    const cost = Number(newCost)
    if (!cost || cost < 1) { showError('Укажите корректное количество XP'); return }
    setCreating(true)
    try {
      await apiClient.createReward({
        family_id: family.id,
        icon: newIcon,
        title: newTitle.trim(),
        description: newDesc.trim(),
        points_cost: cost,
        type: newType,
        rarity: newRarity,
      })
      queryClient.invalidateQueries({ queryKey: ['rewards'] })
      setCreateVisible(false)
      showSuccess('Награда добавлена!')
    } catch (e) {
      showError(e?.message || 'Не удалось создать награду')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteReward = (reward) => {
    if (reward._source !== 'db') return
    Alert.alert('Удалить награду?', `«${reward.title}» будет удалена.`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.request(`/rewards/${reward.id}`, { method: 'DELETE' })
            queryClient.invalidateQueries({ queryKey: ['rewards'] })
            showSuccess('Награда удалена')
          } catch (e) {
            showError(e?.message || 'Не удалось удалить')
          }
        },
      },
    ])
  }

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
        data={allRewards}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + 12, paddingBottom: 132 }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={typography.caption}>Игровые награды</Text>
                <Text style={typography.hero}>Магазин</Text>
                <Text style={[typography.subtitle, { marginTop: 6 }]}>
                  {isParent ? 'Управляйте наградами для детей' : `У вас ${currentPoints} XP`}
                </Text>
              </View>
              <View style={styles.rightCol}>
                {!isParent && (
                  <View style={styles.pointsCard}>
                    <Text style={styles.pointsValue}>{currentPoints} XP</Text>
                  </View>
                )}
                {isParent && (
                  <Pressable style={styles.addBtn} onPress={openCreate}>
                    <Plus size={18} color="#fff" />
                  </Pressable>
                )}
              </View>
            </View>

            <View style={[styles.infoCard, shadows.card]}>
              <View style={styles.infoIconWrap}>
                {isParent ? <Trophy size={18} color={colors.primary} /> : <Sparkles size={18} color={colors.primary} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>{isParent ? 'Создавайте свои награды' : 'Обмен XP на награды'}</Text>
                <Text style={styles.infoText}>
                  {isParent
                    ? 'Нажмите + чтобы добавить персональную награду для своего ребёнка. Дети видят и покупают их за XP.'
                    : 'Выполняйте задачи, копите XP и открывайте более редкие награды.'}
                </Text>
              </View>
            </View>

            {dbRewards.length > 0 && (
              <Text style={styles.sectionLabel}>Награды от родителей</Text>
            )}
          </>
        }
        renderItem={({ item, index }) => {
          const isFirstStatic = item._source === 'static' && (index === 0 || allRewards[index - 1]?._source === 'db')
          return (
            <>
              {isFirstStatic && dbRewards.length > 0 && (
                <Text style={styles.sectionLabel}>Стандартные награды</Text>
              )}
              <View>
                <RewardCard
                  reward={item}
                  currentPoints={currentPoints}
                  isParent={isParent}
                  onRedeem={reward => redeemMutation.mutate(reward)}
                />
                {isParent && item._source === 'db' && (
                  <Pressable style={styles.deleteRewardBtn} onPress={() => handleDeleteReward(item)}>
                    <Text style={styles.deleteRewardText}>Удалить награду</Text>
                  </Pressable>
                )}
              </View>
            </>
          )
        }}
      />

      {/* Modal создания награды */}
      <Modal visible={createVisible} animationType="slide" transparent onRequestClose={() => setCreateVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setCreateVisible(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]} onPress={e => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Новая награда</Text>
              <Pressable onPress={() => setCreateVisible(false)} hitSlop={12}>
                <X size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Иконка</Text>
              <View style={styles.emojiRow}>
                {EMOJI_PRESETS.map(e => (
                  <Pressable
                    key={e}
                    style={[styles.emojiChip, newIcon === e && styles.emojiChipActive]}
                    onPress={() => setNewIcon(e)}
                  >
                    <Text style={styles.emojiText}>{e}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={styles.emojiInput}
                value={newIcon}
                onChangeText={v => setNewIcon(v.slice(-2) || '🎁')}
                placeholder="Или введи эмодзи вручную"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.fieldLabel}>Название *</Text>
              <TextInput
                style={styles.input}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="Например: Поход в кино"
                placeholderTextColor={colors.textMuted}
                maxLength={60}
              />

              <Text style={styles.fieldLabel}>Описание</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={newDesc}
                onChangeText={setNewDesc}
                placeholder="Подробности награды…"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={200}
              />

              <Text style={styles.fieldLabel}>Стоимость в XP *</Text>
              <View style={styles.costRow}>
                <View style={styles.costIconWrap}>
                  <Coins size={18} color={colors.primary} />
                </View>
                <TextInput
                  style={styles.costInput}
                  value={newCost}
                  onChangeText={v => setNewCost(v.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  placeholder="50"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <Text style={styles.fieldLabel}>Тип</Text>
              <View style={styles.chipRow}>
                {TYPE_OPTIONS.map(o => (
                  <Pressable
                    key={o.value}
                    style={[styles.optChip, newType === o.value && styles.optChipActive]}
                    onPress={() => setNewType(o.value)}
                  >
                    <Text style={[styles.optChipText, newType === o.value && styles.optChipTextActive]}>{o.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Редкость</Text>
              <View style={styles.chipRow}>
                {RARITY_OPTIONS.map(o => (
                  <Pressable
                    key={o.value}
                    style={[styles.optChip, newRarity === o.value && styles.optChipActive]}
                    onPress={() => setNewRarity(o.value)}
                  >
                    <Text style={[styles.optChipText, newRarity === o.value && styles.optChipTextActive, { color: newRarity === o.value ? '#fff' : o.color }]}>
                      {o.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                style={[styles.createBtn, creating && { opacity: 0.6 }]}
                onPress={handleCreate}
                disabled={creating}
              >
                {creating
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.createBtnText}>Добавить награду</Text>
                }
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  rightCol: { alignItems: 'flex-end', gap: 8 },
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
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.press,
  },
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
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  infoTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 3 },
  infoText: { fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 0.5, marginBottom: 8, marginTop: 4,
  },
  deleteRewardBtn: {
    alignSelf: 'flex-end', marginTop: -6, marginBottom: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radius.sm, backgroundColor: '#fee2e2',
  },
  deleteRewardText: { fontSize: 11, fontWeight: '700', color: '#ef4444' },
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surfaceStrong,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '88%',
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 8, letterSpacing: 0.4 },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  emojiChip: {
    width: 42, height: 42, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.muted, borderWidth: 1.5, borderColor: 'transparent',
  },
  emojiChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  emojiText: { fontSize: 22 },
  emojiInput: {
    borderWidth: 1, borderColor: colors.outline, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: colors.text, backgroundColor: colors.muted,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1.5, borderColor: colors.outline, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: colors.text, backgroundColor: colors.muted, marginBottom: 16,
  },
  textarea: { minHeight: 72, textAlignVertical: 'top' },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.outline,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    marginBottom: 16,
    overflow: 'hidden',
  },
  costIconWrap: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.primaryMuted,
    borderRightWidth: 1.5,
    borderRightColor: colors.outline,
  },
  costInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  optChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full,
    borderWidth: 1.5, borderColor: colors.outline, backgroundColor: colors.muted,
  },
  optChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optChipText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  optChipTextActive: { color: '#fff' },
  createBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  createBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
})
