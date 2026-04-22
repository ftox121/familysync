import { useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Picker } from '@react-native-picker/picker'
import { parseDate } from '../lib/utils'
import { ArrowLeft, CheckCircle2, Clock, Pencil, Sparkles, Star, Trash2, X } from 'lucide-react-native'
import {
  ActivityIndicator,
  Alert,
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
import { FamilyAccessPolicy } from '../domain/access/FamilyAccessPolicy'
import { GamificationService } from '../domain/gamification/GamificationService'
import MemberAvatar from '../components/MemberAvatar'
import ScreenBackground from '../components/ScreenBackground'
import { useFamilyContext } from '../context/FamilyContext'
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from '../lib/utils'
import { showError, showSuccess } from '../lib/toast'
import { getStreakData, saveStreakData } from '../lib/streakStorage'
import { colors, radius, shadows, spacing } from '../theme'

function parseAchievements(raw) {
  if (!raw) return []
  try {
    const j = JSON.parse(raw)
    return Array.isArray(j) ? j : []
  } catch {
    return []
  }
}

export default function TaskDetailScreen({ navigation, route }) {
  const { taskId } = route.params || {}
  const {
    tasks,
    members,
    currentMembership,
    user,
    isChild,
    isParent,
    refresh,
    isLoading: familyLoading,
  } = useFamilyContext()
  const [loading, setLoading] = useState(false)
  const [editVisible, setEditVisible] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPriority, setEditPriority] = useState('medium')
  const [editDueDate, setEditDueDate] = useState('')
  const [editAssignedTo, setEditAssignedTo] = useState('')
  const [editShowDate, setEditShowDate] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const insets = useSafeAreaInsets()

  const task = tasks.find(t => t.id === taskId)
  const assignee = members?.find(m => m.user_email === task?.assigned_to)
  const questParticipants = Array.isArray(task?.participants) ? task.participants : []
  const questParticipantMembers = questParticipants
    .map(p => ({ participant: p, member: members?.find(m => m.user_email === p.user_email) }))
    .filter(Boolean)
  const currentQuestParticipation = questParticipants.find(p => p.user_email === user?.email)
  const completedQuestCount = questParticipants.filter(p => p.status === 'completed').length
  const role = currentMembership?.role
  const canDelete = FamilyAccessPolicy.canDeleteTask(role)
  const canDirectComplete = isParent || role === 'grandparent' || role === 'other'
  const canConfirm = isParent || role === 'grandparent' || role === 'other'

  const childMembers = members.filter(m => m.role === 'child')

  const openEdit = () => {
    setEditTitle(task?.title ?? '')
    setEditDesc(task?.description ?? '')
    setEditPriority(task?.priority ?? 'medium')
    setEditDueDate(task?.due_date ?? '')
    setEditAssignedTo(task?.assigned_to ?? '')
    setEditVisible(true)
  }

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return
    setEditSaving(true)
    try {
      await apiClient.updateTask(task.id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        priority: editPriority,
        due_date: editDueDate || null,
        assigned_to: editAssignedTo || null,
      })
      refresh()
      setEditVisible(false)
      showSuccess('Задача обновлена')
    } catch (e) {
      showError(e?.message || 'Не удалось сохранить')
    } finally {
      setEditSaving(false)
    }
  }

  if (familyLoading)
    return (
      <ScreenBackground>
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenBackground>
    )

  if (!task)
    return (
      <ScreenBackground>
        <View style={[styles.center, { paddingTop: insets.top, paddingHorizontal: spacing.screen }]}>
          <Text style={styles.missing}>Задача не найдена</Text>
          <Pressable style={styles.backLink} onPress={() => navigation.goBack()}>
            <Text style={styles.backLinkText}>Назад</Text>
          </Pressable>
        </View>
      </ScreenBackground>
    )

  /** Начисление звезд и достижений при финальном завершении (родитель или ребёнок после подтверждения). */
  const applyCompletionRewards = async (assigneeMember, completedAtIso) => {
    if (!assigneeMember || !task.assigned_to) return

    // Серия хранится локально в AsyncStorage (не требует дополнительных колонок в БД)
    const streakData = await getStreakData(task.assigned_to)
    const streakBefore = streakData.streakCount
    const taskWithDone = { ...task, status: 'completed', completed_at: completedAtIso }
    const xpDetail = GamificationService.computeTaskRewardXp(taskWithDone, {
      streakCount: streakBefore,
      memberXp: assigneeMember.points ?? 0,
    })
    const newStreak = GamificationService.nextStreakCount(
      streakBefore,
      streakData.lastCompletedAt
    )
    const wasOnTime = GamificationService.wasTaskCompletedOnTime(taskWithDone)
    const newOnTime = GamificationService.nextOnTimeStreak(streakData.onTimeStreak, wasOnTime)

    // Сохраняем серию локально
    await saveStreakData(task.assigned_to, {
      streakCount: newStreak,
      onTimeStreak: newOnTime,
      lastCompletedAt: completedAtIso,
    })

    const nextTasksDone = (assigneeMember.tasks_completed ?? 0) + 1
    const newPoints = (assigneeMember.points ?? 0) + xpDetail.total
    const prevAch = parseAchievements(assigneeMember.achievements_json)
    const unlocked = GamificationService.evaluateNewAchievements(
      { ...assigneeMember, tasks_completed: nextTasksDone, points: newPoints },
      { streakCount: newStreak, onTimeStreak: newOnTime }
    )
    const mergedAch = [...prevAch, ...unlocked.map(a => a.id)]

    // Обновляем на сервере только поля, которые точно есть в БД
    const memberPayload = {
      points: newPoints,
      tasks_completed: nextTasksDone,
      level: Math.floor(newPoints / 100) + 1,
      achievements_json: JSON.stringify(mergedAch),
    }

    await apiClient.updateFamilyMember(assigneeMember.id, memberPayload)

    if (unlocked.length > 0) {
      const achNames = unlocked.map(a => `«${a.title}»`).join(', ')
      await apiClient.createNotification({
        family_id: currentMembership.family_id,
        user_email: task.assigned_to,
        title: '🏆 Новое достижение!',
        message: `Разблокировано: ${achNames}`,
        type: 'achievement',
      })
    }

    await apiClient.createNotification({
      family_id: currentMembership.family_id,
      user_email: task.assigned_to,
      title: 'Задача выполнена!',
      message: `+${xpDetail.total} ★ за «${task.title}» (${GamificationService.getTierForXp(newPoints).tier.title})`,
      type: 'achievement',
    })
  }

  const notifyAdultsReview = async () => {
    const adults = members.filter(m => FamilyAccessPolicy.canConfirmChildCompletion(m.role))
    for (const a of adults) {
      if (a.user_email === user?.email) continue
      const notificationPayload = {
        family_id: currentMembership.family_id ?? currentMembership.family_id,
        user_email: a.user_email,
        title: 'Задача на проверке',
        message: `«${task.title}» отправлена на подтверждение`,
        type: 'task_completed',
      }

      await apiClient.createNotification(notificationPayload)
    }
  }

  const finalizeCompletion = async () => {
    setLoading(true)
    try {
      const completedAt = new Date().toISOString()
      const assigneeMember = assignee
      if (assigneeMember) await applyCompletionRewards(assigneeMember, completedAt)
      const payload = {
        status: 'completed',
      }
      await apiClient.updateTask(task.id, payload)
      showSuccess('Задача подтверждена и закрыта')
      refresh()
    } catch (error) {
      showError(error?.message || 'Не удалось подтвердить выполнение')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async newStatus => {
    if (newStatus === 'completed' && !canDirectComplete) {
      showError('Ребёнок не может закрыть задачу сам — отправьте на проверку родителю')
      return
    }

    if (newStatus === 'completed' && task.status !== 'completed') {
      setLoading(true)
      try {
        const completedAt = new Date().toISOString()
        const assigneeMember = assignee
        if (assigneeMember) await applyCompletionRewards(assigneeMember, completedAt)
        const payload = {
          status: 'completed',
        }
        await apiClient.updateTask(task.id, payload)
        showSuccess('Задача выполнена')
        refresh()
      } catch (error) {
        showError(error?.message || 'Не удалось отметить задачу выполненной')
      } finally {
        setLoading(false)
      }
      return
    }

    setLoading(true)
    try {
      await apiClient.updateTask(task.id, { status: newStatus })
      showSuccess('Статус обновлён')
      refresh()
    } catch (error) {
      showError(error?.message || 'Не удалось обновить статус')
    } finally {
      setLoading(false)
    }
  }

  const submitForParentReview = async () => {
    setLoading(true)
    try {
      const payload = {
        status: 'pending_confirmation',
      }
      await apiClient.updateTask(task.id, payload)
      await notifyAdultsReview()
      showSuccess('Отправлено родителю на проверку')
      refresh()
    } catch (error) {
      showError(error?.message || 'Не удалось отправить на проверку')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = () => {
    if (!FamilyAccessPolicy.canDeleteTask(role)) {
      showError('Удалять задачи могут только родители')
      return
    }
    Alert.alert('Удалить задачу?', 'Это действие нельзя отменить.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          setLoading(true)
          try {
            await apiClient.deleteTask(task.id)
            showSuccess('Задача удалена')
            refresh()
            navigation.navigate('MainTabs', { screen: 'Tasks' })
          } catch (error) {
            showError(error?.message || 'Не удалось удалить задачу')
          } finally {
            setLoading(false)
          }
        },
      },
    ])
  }

  const showChildSubmit =
    !task?.is_quest &&
    isChild &&
    task.status !== 'completed' &&
    task.status !== 'pending_confirmation' &&
    task.assigned_to === user?.email

  const showParentConfirm = !task?.is_quest && canConfirm && task.status === 'pending_confirmation'
  const showQuestParticipate =
    task?.is_quest &&
    task.status !== 'completed' &&
    currentQuestParticipation &&
    currentQuestParticipation.status !== 'completed'

  const adultStatuses = ['pending', 'in_progress', 'pending_confirmation', 'completed']
  const childStatuses = [
    'pending',
    'in_progress',
    ...(task.status === 'pending_confirmation' ? ['pending_confirmation'] : []),
    ...(task.status === 'completed' ? ['completed'] : []),
  ]
  const availableStatuses = canDirectComplete ? adultStatuses : childStatuses

  const completeQuestParticipation = async () => {
    setLoading(true)
    try {
      await apiClient.completeQuestParticipation(task.id)
      showSuccess('Ваше участие в квесте отмечено')
      refresh()
    } catch (error) {
      showError(error?.message || 'Не удалось отметить участие')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenBackground>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.top}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.h1}>Детали задачи</Text>
        <View style={styles.topActions}>
          {isParent && task?.status !== 'completed' && (
            <Pressable onPress={openEdit} disabled={loading} hitSlop={12} style={styles.topActionBtn}>
              <Pencil size={18} color={colors.primary} />
            </Pressable>
          )}
          {canDelete ? (
            <Pressable onPress={handleDelete} disabled={loading} hitSlop={12} style={styles.topActionBtn}>
              <Trash2 size={20} color={colors.red} />
            </Pressable>
          ) : (
            <View style={{ width: 20 }} />
          )}
        </View>
      </View>

      <View style={[styles.card, shadows.card]}>
        <Text style={styles.title}>{task.title}</Text>
        {!!task.description && <Text style={styles.desc}>{task.description}</Text>}

        <View style={styles.badges}>
          {task.is_quest ? (
            <View style={styles.questBadge}>
              <Sparkles size={12} color="#7c3aed" />
              <Text style={styles.questBadgeText}>Epic Quest</Text>
            </View>
          ) : null}
          <View style={styles.badgeMuted}>
            <Text style={styles.badgeMutedText}>{CATEGORY_LABELS[task.category]}</Text>
          </View>
          <View style={styles.badgeOutline}>
            <Text style={styles.badgeOutlineText}>{PRIORITY_LABELS[task.priority]}</Text>
          </View>
          {task.due_date && (() => {
            const d = new Date(task.due_date)
            const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0
            return (
              <View style={[styles.badgeOutline, styles.badgeRow]}>
                <Clock size={12} color={colors.textMuted} />
                <Text style={styles.badgeOutlineText}>
                  {format(d, hasTime ? 'd MMM yyyy, HH:mm' : 'd MMM yyyy', { locale: ru })}
                </Text>
              </View>
            )
          })()}
          <View style={styles.badgeViolet}>
            <Star size={12} color={colors.primary} />
            <Text style={styles.badgeVioletText}>{task.points_reward || 10} баллов</Text>
          </View>
        </View>

        {assignee && (
          <View style={styles.assignee}>
            <MemberAvatar name={assignee.display_name} color={assignee.avatar_color} animalId={assignee.animal_id} size="md" />
            <View>
              <Text style={styles.assigneeName}>{assignee.display_name}</Text>
              <Text style={styles.assigneeRole}>Исполнитель</Text>
            </View>
          </View>
        )}

        {task.is_quest ? (
          <View style={styles.questPanel}>
            <Text style={styles.questTitle}>Участники квеста</Text>
            <Text style={styles.questMeta}>
              Выполнили: {completedQuestCount} из {task.min_participants || 1} необходимых
            </Text>
            <View style={styles.questParticipantsWrap}>
              {questParticipantMembers.map(({ participant, member }) => (
                <View key={participant.user_email} style={styles.questMemberRow}>
                  <MemberAvatar
                    name={member?.display_name || participant.user_email}
                    color={member?.avatar_color}
                    animalId={member?.animal_id}
                    size="sm"
                  />
                  <Text style={styles.questMemberName}>{member?.display_name || participant.user_email}</Text>
                  <View style={[styles.questStatusPill, participant.status === 'completed' && styles.questStatusPillDone]}>
                    <Text style={[styles.questStatusText, participant.status === 'completed' && styles.questStatusTextDone]}>
                      {participant.status === 'completed' ? 'Готово' : 'В процессе'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>Статус</Text>
        <View style={styles.currentStatusRow}>
          <Text style={styles.currentStatusLabel}>Текущий статус</Text>
          <View style={styles.currentStatusPill}>
            <Text style={styles.currentStatusText}>{STATUS_LABELS[task.status] || 'Не указан'}</Text>
          </View>
        </View>

        {!task.is_quest && !isChild && task.status !== 'completed' && task.status !== 'pending_confirmation' && (
          <Pressable
            style={[styles.cta, styles.ctaInline, loading && styles.ctaDisabled]}
            onPress={() => handleStatusChange('completed')}
            disabled={loading}
          >
            <CheckCircle2 size={18} color="#fff" />
            <Text style={styles.ctaText}>Отметить выполненным</Text>
          </Pressable>
        )}

        {!task.is_quest ? (
          <View style={styles.statusGrid}>
            {availableStatuses.map(status => {
              const active = task.status === status
              const disabled = loading || (isChild && task.status === 'pending_confirmation')
              return (
                <Pressable
                  key={status}
                  disabled={disabled || active}
                  onPress={() => handleStatusChange(status)}
                  style={({ pressed }) => [
                    styles.statusChip,
                    active && styles.statusChipActive,
                    disabled && !active && styles.statusChipDisabled,
                    pressed && !disabled && !active && { opacity: 0.9 },
                  ]}
                >
                  <Text style={[styles.statusChipText, active && styles.statusChipTextActive]}>
                    {STATUS_LABELS[status]}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        ) : null}
        {loading && (
          <View style={styles.inlineLoad}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}

        {showChildSubmit && (
          <Pressable
            style={[styles.cta, loading && styles.ctaDisabled]}
            onPress={submitForParentReview}
            disabled={loading}
          >
            <CheckCircle2 size={18} color="#fff" />
            <Text style={styles.ctaText}>Готово, отправить на проверку</Text>
          </Pressable>
        )}

        {showQuestParticipate ? (
          <Pressable
            style={[styles.cta, loading && styles.ctaDisabled]}
            onPress={completeQuestParticipation}
            disabled={loading}
          >
            <CheckCircle2 size={18} color="#fff" />
            <Text style={styles.ctaText}>Отметить участие в квесте</Text>
          </Pressable>
        ) : null}

        {showParentConfirm && (
          <Pressable
            style={[styles.cta, loading && styles.ctaDisabled]}
            onPress={finalizeCompletion}
            disabled={loading}
          >
            <CheckCircle2 size={18} color="#fff" />
            <Text style={styles.ctaText}>Подтвердить выполнение</Text>
          </Pressable>
        )}

        {(task.completed_at || (task.status === 'completed' ? task.updated_at : null)) && (
          <Text style={styles.doneAt}>
            Выполнено:{' '}
            {format(parseDate(task.completed_at || task.updated_at), 'd MMMM yyyy, HH:mm', { locale: ru })}
          </Text>
        )}

      </View>
      </ScrollView>

      <Modal visible={editVisible} animationType="slide" transparent onRequestClose={() => setEditVisible(false)}>
        <Pressable style={styles.editOverlay} onPress={() => setEditVisible(false)}>
          <Pressable style={[styles.editSheet, { paddingBottom: insets.bottom + 24 }]} onPress={e => e.stopPropagation()}>
            <View style={styles.editHeader}>
              <Text style={styles.editHeaderTitle}>Редактировать задачу</Text>
              <Pressable onPress={() => setEditVisible(false)} hitSlop={12}>
                <X size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.editLabel}>Название *</Text>
              <TextInput
                style={styles.editInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Название задачи"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.editLabel}>Описание</Text>
              <TextInput
                style={[styles.editInput, styles.editTextarea]}
                value={editDesc}
                onChangeText={setEditDesc}
                placeholder="Детали…"
                placeholderTextColor={colors.textMuted}
                multiline
              />

              <Text style={styles.editLabel}>Приоритет</Text>
              <View style={styles.editPickerWrap}>
                <Picker selectedValue={editPriority} onValueChange={setEditPriority}>
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                    <Picker.Item key={k} label={v} value={k} />
                  ))}
                </Picker>
              </View>

              {!task?.is_quest && (
                <>
                  <Text style={styles.editLabel}>Назначить</Text>
                  <View style={styles.editPickerWrap}>
                    <Picker selectedValue={editAssignedTo} onValueChange={setEditAssignedTo}>
                      <Picker.Item label="— не назначено —" value="" />
                      {childMembers.map(m => (
                        <Picker.Item key={m.id} label={m.display_name} value={m.user_email} />
                      ))}
                    </Picker>
                  </View>
                </>
              )}

              <Text style={styles.editLabel}>Дедлайн</Text>
              <Pressable style={styles.editDateBtn} onPress={() => setEditShowDate(true)}>
                <Clock size={16} color={colors.primary} />
                <Text style={styles.editDateText}>
                  {editDueDate
                    ? format(new Date(editDueDate + 'T12:00:00'), 'd MMMM yyyy', { locale: ru })
                    : 'Выбрать дату'}
                </Text>
                {editDueDate ? (
                  <Pressable onPress={() => setEditDueDate('')} hitSlop={10}>
                    <X size={14} color={colors.textMuted} />
                  </Pressable>
                ) : null}
              </Pressable>
              {editShowDate && (
                <DateTimePicker
                  value={editDueDate ? new Date(editDueDate) : new Date()}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    if (Platform.OS === 'android') setEditShowDate(false)
                    if (event?.type === 'dismissed') return
                    if (date) setEditDueDate(date.toISOString())
                  }}
                />
              )}
              {Platform.OS === 'ios' && editShowDate && (
                <Pressable style={styles.editDoneDate} onPress={() => setEditShowDate(false)}>
                  <Text style={styles.editDoneDateText}>Готово</Text>
                </Pressable>
              )}

              <Pressable
                style={[styles.editSaveBtn, editSaving && { opacity: 0.6 }]}
                onPress={handleSaveEdit}
                disabled={editSaving}
              >
                {editSaving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.editSaveBtnText}>Сохранить изменения</Text>
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
  flex: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: spacing.screen },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  h1: { fontSize: 18, fontWeight: '800', color: colors.text, flex: 1, textAlign: 'center' },
  card: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.outline,
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  desc: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badgeMuted: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.muted,
  },
  badgeMutedText: { fontSize: 12, color: colors.textSecondary },
  questBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#f3e8ff',
  },
  questBadgeText: { fontSize: 12, color: '#7c3aed', fontWeight: '800' },
  badgeOutline: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeOutlineText: { fontSize: 12, color: colors.textSecondary },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badgeViolet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.violetSoft,
  },
  badgeVioletText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  assignee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.muted,
    borderRadius: 12,
    marginTop: 4,
  },
  assigneeName: { fontSize: 14, fontWeight: '700', color: colors.text },
  assigneeRole: { fontSize: 12, color: colors.textMuted },
  questPanel: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  questTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  questMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 4, marginBottom: 10 },
  questParticipantsWrap: { gap: 8 },
  questMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questMemberName: { flex: 1, fontSize: 13, color: colors.text, fontWeight: '600' },
  questStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceStrong,
  },
  questStatusPillDone: { backgroundColor: colors.successBg },
  questStatusText: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  questStatusTextDone: { color: colors.success },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 8 },
  currentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -4,
    marginBottom: -2,
  },
  currentStatusLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  currentStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  currentStatusText: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  statusChipDisabled: {
    opacity: 0.5,
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  statusChipTextActive: {
    color: colors.primary,
  },
  inlineLoad: { alignItems: 'center', paddingVertical: 8 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  ctaInline: {
    marginTop: 2,
    marginBottom: 2,
  },
  ctaSecondary: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaSecondaryText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  doneAt: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  missing: { fontSize: 16, color: colors.textSecondary, marginBottom: 16 },
  backLink: { paddingVertical: 12, paddingHorizontal: 20 },
  backLinkText: { color: colors.primary, fontWeight: '600' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topActionBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.outline,
  },
  // Edit modal
  editOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  editSheet: {
    backgroundColor: colors.surfaceStrong,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '90%',
  },
  editHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
  },
  editHeaderTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  editLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 6, letterSpacing: 0.4 },
  editInput: {
    borderWidth: 1.5, borderColor: colors.outline, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: colors.text, backgroundColor: colors.muted, marginBottom: 16,
  },
  editTextarea: { minHeight: 80, textAlignVertical: 'top' },
  editPickerWrap: {
    borderWidth: 1.5, borderColor: colors.outline, borderRadius: radius.md,
    marginBottom: 16, overflow: 'hidden', backgroundColor: colors.muted,
  },
  editDateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: colors.outline, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.muted, marginBottom: 16,
  },
  editDateText: { flex: 1, fontSize: 15, color: colors.text },
  editDoneDate: { alignSelf: 'flex-end', padding: 8, marginBottom: 8 },
  editDoneDateText: { color: colors.primary, fontWeight: '700' },
  editSaveBtn: {
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  editSaveBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
})
