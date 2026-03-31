import { useState } from 'react'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Picker } from '@react-native-picker/picker'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { LinearGradient } from 'expo-linear-gradient'
import { ArrowLeft, Calendar, Star } from 'lucide-react-native'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { apiClient } from '../api/apiClient'
import AnimalAvatarPicker from '../components/AnimalAvatarPicker'
import ScreenBackground from '../components/ScreenBackground'
import { useFamilyContext } from '../context/FamilyContext'
import { useSmartAssignRecommendation } from '../hooks/useSmartAssignRecommendation'
import { CATEGORY_LABELS, PRIORITY_LABELS, getPointsForStars } from '../lib/utils'
import { showError, showSuccess } from '../lib/toast'
import { colors, gradients, radius, shadows, spacing, typography } from '../theme'

export default function AddTaskScreen({ navigation }) {
  const { currentMembership, members, user, refresh, tasks, isParent } = useFamilyContext()
  const insets = useSafeAreaInsets()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [priority, setPriority] = useState('medium')
  const [rewardStars, setRewardStars] = useState(2)
  const [category, setCategory] = useState('other')
  const [dueDate, setDueDate] = useState('')
  const [showDate, setShowDate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showChildModal, setShowChildModal] = useState(false)
  const [childName, setChildName] = useState('')
  const [childAnimal, setChildAnimal] = useState('cat')

  const points = getPointsForStars(rewardStars)
  const assignVm = useSmartAssignRecommendation(members, tasks)
  const bestEmail = assignVm.bestCandidate?.member.userEmail
  const childMembers = members.filter(m => m.role === 'child')

  const handleCreateChild = async () => {
    if (!childName.trim()) {
      showError('Введите имя ребенка')
      return
    }
    setLoading(true)
    try {
      await apiClient.createChildProfile(currentMembership.family_id, {
        display_name: childName.trim(),
        avatar_color: 'violet',
        animal_id: childAnimal,
      })
      showSuccess('Профиль ребенка добавлен')
      setChildName('')
      setChildAnimal('cat')
      setShowChildModal(false)
      refresh()
    } catch (error) {
      showError(error.message || 'Не удалось добавить профиль ребенка')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      showError('Введите название задачи')
      return
    }
    setLoading(true)
    try {
      const assignee = members.find(m => m.user_email === assignedTo)
      const familyId = currentMembership.family_id
      const taskPayload = {
        family_id: familyId,
        title: title.trim(),
        description: description.trim(),
        assigned_to: assignedTo || null,
        assigned_name: assignee?.display_name ?? null,
        status: 'pending',
        priority,
        category,
        due_date: dueDate || null,
        points_reward: points,
      }

      await apiClient.createTask(taskPayload)

      if (assignedTo && assignedTo !== user.email) {
        const notificationPayload = {
          family_id: familyId,
          user_email: assignedTo,
          title: 'Новая задача!',
          message: `Вам назначена задача: "${title.trim()}"`,
          type: 'task_assigned',
        }

        await apiClient.createNotification(notificationPayload)
      }
      showSuccess('Задача создана!')
      refresh()
      setTitle('')
      setDescription('')
      setAssignedTo('')
      setDueDate('')
      setRewardStars(2)
      navigation.navigate('MainTabs', { screen: 'Tasks' })
    } finally {
      setLoading(false)
    }
  }

  const dateValue = dueDate ? new Date(dueDate + 'T12:00:00') : new Date()

  if (!isParent)
    return (
      <ScreenBackground>
        <View style={[styles.flex, styles.blockedWrap, { paddingTop: insets.top + 24 }]}> 
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.blockedTitle}>Только для родителей</Text>
            <Text style={styles.blockedText}>
              Создавать и назначать задачи могут только родительские аккаунты.
            </Text>
            <Pressable
              onPress={() => navigation.navigate('MainTabs', { screen: 'Tasks' })}
              style={({ pressed }) => [styles.blockedBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.blockedBtnText}>К списку задач</Text>
            </Pressable>
          </View>
        </View>
      </ScreenBackground>
    )

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8, paddingBottom: 140 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.top}>
            <Pressable
              onPress={() => navigation.navigate('MainTabs', { screen: 'Tasks' })}
              hitSlop={12}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            >
              <ArrowLeft size={22} color={colors.text} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={typography.caption}>Новое поручение</Text>
              <Text style={typography.title}>Добавить задачу</Text>
            </View>
          </View>

          <View style={[styles.card, shadows.card]}>
            <Text style={styles.label}>Название *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Что нужно сделать?"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Описание</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Детали для семьи…"
              placeholderTextColor={colors.textMuted}
              multiline
            />

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Категория</Text>
                <View style={styles.pickerWrap}>
                  <Picker selectedValue={category} onValueChange={setCategory}>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <Picker.Item key={k} label={v} value={k} />
                    ))}
                  </Picker>
                </View>
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Приоритет</Text>
                <View style={styles.pickerWrap}>
                  <Picker selectedValue={priority} onValueChange={setPriority}>
                    {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                      <Picker.Item key={k} label={v} value={k} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            <Text style={styles.label}>Назначить</Text>
            {childMembers.length === 0 ? (
              <View style={styles.noChildrenBox}>
                <Text style={styles.noChildrenText}>Сначала добавьте профиль ребенка, чтобы назначать задачи.</Text>
                <Pressable style={styles.noChildrenBtn} onPress={() => setShowChildModal(true)}>
                  <Text style={styles.noChildrenBtnText}>Добавить ребенка</Text>
                </Pressable>
              </View>
            ) : null}
            {assignVm.bestCandidate ? (
              <View style={styles.suggest}>
                <Text style={styles.suggestText}>{assignVm.recommendationText}</Text>
                <Text style={styles.suggestMeta}>
                  Оценка: {assignVm.bestCandidate.score.toFixed(2)}
                </Text>
                {bestEmail && assignedTo !== bestEmail ? (
                  <Pressable
                    style={({ pressed }) => [styles.suggestBtn, pressed && { opacity: 0.9 }]}
                    onPress={() => setAssignedTo(bestEmail)}
                  >
                    <Text style={styles.suggestBtnText}>Назначить рекомендованного</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            <View style={styles.pickerWrap}>
              <Picker selectedValue={assignedTo} onValueChange={setAssignedTo}>
                <Picker.Item label="— не назначено —" value="" />
                {childMembers.map(m => (
                  <Picker.Item key={m.id} label={m.display_name} value={m.user_email} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Дедлайн</Text>
            <Pressable
              style={styles.dateBtn}
              onPress={() => setShowDate(true)}
            >
              <Calendar size={18} color={colors.primary} />
              <Text style={styles.dateBtnText}>
                {dueDate ? format(dateValue, 'd MMMM yyyy', { locale: ru }) : 'Выберите дату'}
              </Text>
            </Pressable>
            {showDate ? (
              <DateTimePicker
                value={dateValue}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  if (Platform.OS === 'android') setShowDate(false)
                  if (event?.type === 'dismissed') return
                  if (date) setDueDate(format(date, 'yyyy-MM-dd'))
                }}
              />
            ) : null}
            {Platform.OS === 'ios' && showDate ? (
              <Pressable style={styles.doneDate} onPress={() => setShowDate(false)}>
                <Text style={styles.doneDateText}>Готово</Text>
              </Pressable>
            ) : null}

            <Text style={styles.label}>Награда за выполнение</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => {
                const active = star <= rewardStars
                return (
                  <Pressable
                    key={star}
                    onPress={() => setRewardStars(star)}
                    style={({ pressed }) => [styles.starBtn, pressed && { opacity: 0.85 }]}
                  >
                    <Star
                      size={24}
                      color={active ? colors.priorityMed : colors.textMuted}
                      fill={active ? colors.priorityMed : 'transparent'}
                    />
                  </Pressable>
                )
              })}
            </View>

            <View style={styles.reward}>
              <Star size={18} color={colors.priorityMed} />
              <Text style={styles.rewardText}>
                Награда за выполнение: <Text style={styles.rewardBold}>{rewardStars} ★ • {points} XP</Text>
              </Text>
            </View>

            <Pressable onPress={handleSubmit} disabled={loading} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
              <LinearGradient
                colors={gradients.primaryBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.cta, loading && styles.ctaDisabled]}
              >
                <Text style={styles.ctaText}>{loading ? 'Создаём…' : 'Создать задачу'}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>

        <Modal visible={showChildModal} transparent animationType="slide" onRequestClose={() => setShowChildModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}> 
              <Text style={styles.modalTitle}>Новый профиль ребенка</Text>
              <TextInput
                style={styles.input}
                placeholder="Имя ребенка"
                placeholderTextColor={colors.textMuted}
                value={childName}
                onChangeText={setChildName}
              />

              <AnimalAvatarPicker selected={childAnimal} onSelect={setChildAnimal} />

              <View style={styles.modalButtons}>
                <Pressable style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setShowChildModal(false)}>
                  <Text style={styles.modalBtnCancelText}>Отмена</Text>
                </Pressable>
                <Pressable style={[styles.modalBtn, styles.modalBtnCreate]} onPress={handleCreateChild}>
                  <Text style={styles.modalBtnCreateText}>Создать</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </ScreenBackground>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  blockedWrap: { paddingHorizontal: spacing.screen },
  scroll: { paddingHorizontal: spacing.screen },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.press,
  },
  card: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: colors.muted,
    color: colors.text,
    marginBottom: 16,
    fontWeight: '500',
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  pickerWrap: {
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radius.md,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: colors.muted,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.muted,
    marginBottom: 16,
  },
  dateBtnText: { fontSize: 15, fontWeight: '600', color: colors.text },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -2,
    marginBottom: 12,
  },
  starBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primaryMuted,
    padding: 16,
    borderRadius: radius.md,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  rewardText: { fontSize: 14, color: colors.textSecondary },
  rewardBold: { fontWeight: '800', color: colors.primary },
  cta: {
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadows.fab,
  },
  ctaDisabled: { opacity: 0.55 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  doneDate: { alignSelf: 'flex-end', padding: 10, marginBottom: 8 },
  doneDateText: { color: colors.primary, fontWeight: '700' },
  suggest: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  suggestText: { fontSize: 14, color: colors.text, fontWeight: '700', lineHeight: 20 },
  suggestMeta: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  suggestBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  suggestBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  noChildrenBox: {
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
  },
  noChildrenText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  noChildrenBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  noChildrenBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  blockedTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 10 },
  blockedText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  blockedBtn: {
    marginTop: 18,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  blockedBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surfaceStrong,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 10 },
  modalBtn: { flex: 1, borderRadius: radius.md, paddingVertical: 13, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: colors.muted },
  modalBtnCreate: { backgroundColor: colors.primary },
  modalBtnCancelText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  modalBtnCreateText: { color: '#fff', fontSize: 14, fontWeight: '700' },
})
