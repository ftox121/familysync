import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CheckCircle2, Clock, Coins, Plus, X } from 'lucide-react-native'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import RewardCard from '../components/RewardCard'
import ScreenBackground from '../components/ScreenBackground'
import { apiClient } from '../api/apiClient'
import { useFamilyContext } from '../context/FamilyContext'
import { addStaticRewardClaim, getStaticRewardClaims } from '../lib/staticRewardClaimsStorage'
import { useTabBar } from '../context/TabBarContext'
import { showError, showSuccess } from '../lib/toast'
import { getRankByXP } from '../ranks/ranks'
import { colors, radius, spacing } from '../theme'

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

const RARITY_META = {
  common: { label: 'Common', color: '#818CF8', badgeColor: '#4F46E5', badgeBg: '#EEF2FF', border: '#C7D2FE' },
  rare: { label: 'Rare', color: '#A855F7', badgeColor: '#7C3AED', badgeBg: '#F3E8FF', border: '#D8B4FE' },
  epic: { label: 'Epic', color: '#EC4899', badgeColor: '#BE185D', badgeBg: '#FCE7F3', border: '#F9A8D4' },
  legendary: { label: 'Legendary', color: '#F59E0B', badgeColor: '#92400E', badgeBg: '#FEF3C7', border: '#FCD34D' },
}

const EMOJI_PRESETS = ['🎁','🍕','🍦','🎮','🎬','🛁','🎨','🚴','⚽','🎤','🏖','🍩','🪀','🐾','🌟','🏆','💎','🎠','🧸','🌈']

function useLoopValue(from, to, duration) {
  const animated = useState(() => new Animated.Value(from))[0]

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animated, {
          toValue: to,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(animated, {
          toValue: from,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [animated, duration, from, to])

  return animated
}

function StarIcon({ color, size = 12 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={color} />
    </Svg>
  )
}

function RewardsBalanceCard({ points }) {
  const scale = useLoopValue(1, 1.04, 2000)
  const rank = getRankByXP(points)

  return (
    <View style={styles.balanceCard}>
      <View>
        <Text style={styles.balanceLabel}>Ваш баланс</Text>
        <View style={styles.balanceRow}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <StarIcon color="#FCD34D" size={18} />
          </Animated.View>
          <Text style={styles.balanceValue}>{points} ★</Text>
        </View>
      </View>
      <View style={styles.rankBadge}>
        <Text style={styles.rankBadgeText}>{{ novice: 'Новичок', responsible: 'Ответственный', reliable: 'Надёжный', guardian: 'Хранитель семьи' }[rank.key] || rank.name} {rank.emoji}</Text>
      </View>
    </View>
  )
}

export default function RewardsScreen() {
  const { currentMembership, family, members, user, isParent, isLoading: contextLoading, refresh } = useFamilyContext()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const { handleScroll, show } = useTabBar()

  const childMembers = members.filter(m => m.role === 'child')
  const [selectedChild, setSelectedChild] = useState(null)

  // Auto-select first child when children load
  useEffect(() => {
    if (isParent && childMembers.length > 0 && !selectedChild) {
      setSelectedChild(childMembers[0])
    }
  }, [isParent, childMembers.length])

  const activeChild = isParent ? selectedChild : currentMembership
  const currentPoints = activeChild?.points || 0

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
  })

  const { data: allClaims = [] } = useQuery({
    queryKey: ['reward-claims', family?.id],
    queryFn: () => apiClient.getRewardClaims(family.id),
    enabled: !!family?.id,
  })

  const claimsEmail = isParent ? selectedChild?.user_email : user?.email
  const myClaims = allClaims.filter(c => c.user_email === claimsEmail)

  const { data: localStaticClaims = [] } = useQuery({
    queryKey: ['static-reward-claims', family?.id, claimsEmail],
    queryFn: () => getStaticRewardClaims(family?.id, claimsEmail),
    enabled: !!family?.id && !!claimsEmail,
  })

  const visibleClaims = [...localStaticClaims, ...myClaims]

  const allRewards = [
    ...dbRewards.map(r => ({ ...r, _source: 'db' })),
    ...STATIC_REWARDS.map(r => ({ ...r, _source: 'static' })),
  ]

  const rarityLegend = useMemo(() => Object.entries(RARITY_META), [])

  const redeemMutation = useMutation({
    mutationFn: async reward => {
      if (!activeChild?.id) throw new Error(isParent ? 'Выберите ребёнка для покупки' : 'Профиль участника не найден')
      if (currentPoints < reward.points_cost) throw new Error('Недостаточно звезд')
      if (reward._source === 'db') {
        await apiClient.redeemReward(reward.id, isParent ? activeChild.user_email : null)
      } else {
        await apiClient.updateFamilyMember(activeChild.id, {
          points: currentPoints - reward.points_cost,
        })
        await addStaticRewardClaim(family.id, activeChild.user_email, reward)
      }
    },
    onSuccess: (_, reward) => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] })
      queryClient.invalidateQueries({ queryKey: ['reward-claims'] })
      queryClient.invalidateQueries({ queryKey: ['static-reward-claims'] })
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
    if (!cost || cost < 1) { showError('Укажите корректное количество звезд'); return }
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
                <Text style={styles.subtitle}>Игровые награды</Text>
                <Text style={styles.title}>Магазин</Text>
                <Text style={styles.hint}> 
                  {isParent
                    ? (selectedChild ? `${selectedChild.display_name}: ${currentPoints} ★` : 'Выберите ребёнка')
                    : `У вас ${currentPoints} ★`}
                </Text>
              </View>
              <View style={styles.rightCol}>
                {!isParent && (
                  <View style={styles.pointsCard}>
                    <Text style={styles.pointsValue}>{currentPoints} ★</Text>
                  </View>
                )}
                {isParent && (
                  <Pressable style={styles.addBtn} onPress={openCreate}>
                    <Plus size={18} color="#fff" />
                  </Pressable>
                )}
              </View>
            </View>

            <RewardsBalanceCard points={currentPoints} />

            {isParent && childMembers.length > 0 && (
              <View style={styles.childSelectorRow}>
                {childMembers.map(child => (
                  <Pressable
                    key={child.id}
                    style={[styles.childChip, selectedChild?.id === child.id && styles.childChipActive]}
                    onPress={() => setSelectedChild(child)}
                  >
                    <Text style={[styles.childChipText, selectedChild?.id === child.id && styles.childChipTextActive]}>
                      {child.display_name}
                    </Text>
                    {selectedChild?.id === child.id && (
                      <Text style={styles.childChipXp}>{child.points || 0} ★</Text>
                    )}
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.promo}>
              <Text style={{ fontSize: 28 }}>{isParent ? '🏆' : '✨'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.promoTitle}>{isParent ? 'Создавайте свои награды' : 'Обмен звезд на награды'}</Text>
                <Text style={styles.promoSub}>
                  {isParent
                    ? 'Выберите ребёнка выше и покупайте ему награды за его звезды.'
                    : 'Выполняйте задачи, копите звезды и открывайте более редкие награды.'}
                </Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rarityScroll} contentContainerStyle={styles.rarityScrollContent}>
              {rarityLegend.map(([key, rarity]) => (
                <View key={key} style={[styles.rarityChip, { backgroundColor: rarity.badgeBg, borderColor: rarity.border }]}> 
                  <StarIcon color={rarity.color} size={8} />
                  <Text style={[styles.rarityChipText, { color: rarity.badgeColor }]}>{rarity.label}</Text>
                </View>
              ))}
            </ScrollView>

            {visibleClaims.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Мои награды</Text>
                {visibleClaims.map(claim => {
                  const isActive = claim.status === 'active'
                  const isPending = claim.status === 'pending'
                  const isApproved = claim.status === 'approved'
                  return (
                    <View key={claim.id} style={[styles.claimCard, isActive && styles.claimCardActive]}>
                      <Text style={styles.claimIcon}>{claim.icon || '🎁'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.claimTitle}>{claim.title}</Text>
                        {isActive && claim.active_until && (
                          <View style={styles.claimMeta}>
                            <Clock size={11} color={colors.primary} />
                            <Text style={styles.claimMetaText}>
                              До {format(new Date(claim.active_until), 'd MMM, HH:mm', { locale: ru })}
                            </Text>
                          </View>
                        )}
                        {isPending && (
                          <Text style={[styles.claimMetaText, { color: colors.textMuted }]}>
                            Ожидает подтверждения
                          </Text>
                        )}
                        {isApproved && (
                          <View style={styles.claimMeta}>
                            <CheckCircle2 size={11} color={colors.success} />
                            <Text style={[styles.claimMetaText, { color: colors.success }]}>Одобрено</Text>
                          </View>
                        )}
                      </View>
                      <View style={[
                        styles.claimBadge,
                        isActive && styles.claimBadgeActive,
                        isPending && styles.claimBadgePending,
                        isApproved && styles.claimBadgeApproved,
                      ]}>
                        <Text style={[
                          styles.claimBadgeText,
                          isActive && styles.claimBadgeTextActive,
                          isPending && { color: colors.textMuted },
                          isApproved && { color: colors.success },
                        ]}>
                          {isActive ? 'Активна' : isPending ? 'Ожидание' : 'Получена'}
                        </Text>
                      </View>
                    </View>
                  )
                })}
              </>
            )}

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
                  reward={{ ...item, redeeming: redeemMutation.isLoading && redeemMutation.variables?.id === item.id }}
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

              <Text style={styles.fieldLabel}>Стоимость в звездах *</Text>
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
  subtitle: { fontWeight: '700', fontSize: 13, color: '#A78BFA' },
  title: { fontWeight: '900', fontSize: 30, color: '#1E1B4B', lineHeight: 34 },
  hint: { fontWeight: '600', fontSize: 13, color: '#9CA3AF', marginTop: 2 },
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
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#7C3AED',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  balanceCard: {
    backgroundColor: '#7C3AED',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 14,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: 12 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  balanceValue: { color: '#fff', fontWeight: '900', fontSize: 24 },
  rankBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  rankBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  promo: {
    backgroundColor: '#EDE9FE',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
    marginBottom: 14,
  },
  promoTitle: { fontWeight: '800', fontSize: 14, color: '#4C1D95' },
  promoSub: { fontWeight: '600', fontSize: 12, color: '#7C3AED', marginTop: 2 },
  rarityScroll: { marginBottom: 14 },
  rarityScrollContent: { gap: 6, paddingRight: 4 },
  rarityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  rarityChipText: { fontWeight: '700', fontSize: 11 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 0.5, marginBottom: 8, marginTop: 4,
  },
  childSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1.5,
    borderColor: colors.outline,
  },
  childChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  childChipText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  childChipTextActive: { color: '#fff' },
  childChipXp: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  claimCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1.5,
    borderColor: colors.outline,
    marginBottom: 10,
  },
  claimCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  claimIcon: { fontSize: 26 },
  claimTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 3 },
  claimMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  claimMetaText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  claimBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  claimBadgeActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  claimBadgePending: { backgroundColor: colors.muted },
  claimBadgeApproved: { backgroundColor: colors.successBg, borderColor: colors.success },
  claimBadgeText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  claimBadgeTextActive: { color: colors.primary },
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
