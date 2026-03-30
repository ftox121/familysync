import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { ArrowLeft, Trash2, Star, Clock, CheckCircle2 } from 'lucide-react-native'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import Toast from 'react-native-toast-message'
import { base44 } from '../api/base44Client'
import { useFamilyContext } from '../context/FamilyContext'
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from '../lib/utils'
import { Colors, Radius, Spacing, FontSize } from '../lib/theme'
import MemberAvatar from '../components/MemberAvatar'

const STATUS_OPTIONS = [
  { key: 'pending',     label: 'Ожидает' },
  { key: 'in_progress', label: 'В процессе' },
  { key: 'completed',   label: 'Выполнено' },
]

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:     { bg: Colors.muted,      text: Colors.mutedFg },
  in_progress: { bg: Colors.amberLight, text: '#92400e' },
  completed:   { bg: Colors.greenLight, text: '#166534' },
}

export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { tasks, members, currentMembership, isParent, refresh } = useFamilyContext()
  const [loading, setLoading] = useState(false)

  const task     = tasks.find(t => t.id === id)
  const assignee = members?.find(m => m.user_email === task?.assigned_to)

  if (!task) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    const updates: any = { status: newStatus }

    if (newStatus === 'completed' && task.status !== 'completed') {
      updates.completed_at = new Date().toISOString()
      if (task.assigned_to) {
        const member = members.find(m => m.user_email === task.assigned_to)
        if (member) {
          const newPoints = (member.points || 0) + (task.points_reward || 10)
          await base44.entities.FamilyMember.update(member.id, {
            points: newPoints,
            tasks_completed: (member.tasks_completed || 0) + 1,
            level: Math.floor(newPoints / 100) + 1,
          })
          await base44.entities.Notification.create({
            family_id: currentMembership.family_id,
            user_email: task.assigned_to,
            title: 'Задача выполнена! 🎉',
            message: `Вы получили ${task.points_reward || 10} баллов за "${task.title}"`,
            type: 'achievement',
          })
        }
      }
    }
    await base44.entities.Task.update(task.id, updates)
    Toast.show({ type: 'success', text1: 'Статус обновлён' })
    refresh()
    setLoading(false)
  }

  const handleDelete = () => {
    Alert.alert('Удалить задачу?', 'Это действие нельзя отменить', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive',
        onPress: async () => {
          setLoading(true)
          await base44.entities.Task.delete(task.id)
          Toast.show({ type: 'success', text1: 'Задача удалена' })
          refresh()
          router.back()
          setLoading(false)
        },
      },
    ])
  }

  const statusColors = STATUS_COLORS[task.status] ?? STATUS_COLORS.pending

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Animated.View entering={FadeInDown} style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={Colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Детали задачи</Text>
        {isParent && (
          <TouchableOpacity onPress={handleDelete} disabled={loading} style={styles.deleteBtn}>
            <Trash2 size={20} color={Colors.red} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Main card */}
      <View style={styles.card}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        {task.description ? (
          <Text style={styles.taskDesc}>{task.description}</Text>
        ) : null}

        {/* Tags */}
        <View style={styles.tags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{CATEGORY_LABELS[task.category]}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{PRIORITY_LABELS[task.priority]}</Text>
          </View>
          {task.due_date && (
            <View style={styles.tag}>
              <Clock size={12} color={Colors.mutedFg} />
              <Text style={styles.tagText}>
                {format(new Date(task.due_date), 'd MMM yyyy', { locale: ru })}
              </Text>
            </View>
          )}
          <View style={[styles.tag, { backgroundColor: Colors.violetLight }]}>
            <Star size={12} color={Colors.primary} />
            <Text style={[styles.tagText, { color: Colors.primary }]}>
              {task.points_reward || 10} баллов
            </Text>
          </View>
        </View>

        {/* Assignee */}
        {assignee && (
          <View style={styles.assigneeRow}>
            <MemberAvatar name={assignee.display_name} color={assignee.avatar_color} size="md" />
            <View>
              <Text style={styles.assigneeName}>{assignee.display_name}</Text>
              <Text style={styles.assigneeRole}>Исполнитель</Text>
            </View>
          </View>
        )}

        {/* Status selector */}
        <View>
          <Text style={styles.sectionLabel}>Статус</Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map(s => {
              const isActive = task.status === s.key
              const colors = STATUS_COLORS[s.key]
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[
                    styles.statusChip,
                    isActive && { backgroundColor: colors.bg, borderColor: colors.bg },
                  ]}
                  onPress={() => handleStatusChange(s.key)}
                  disabled={loading}
                >
                  <Text style={[styles.statusChipText, isActive && { color: colors.text, fontWeight: '600' }]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Complete button */}
        {task.status !== 'completed' && (
          <TouchableOpacity
            style={[styles.completeBtn, loading && styles.btnDisabled]}
            onPress={() => handleStatusChange('completed')}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <>
                  <CheckCircle2 size={18} color={Colors.white} />
                  <Text style={styles.completeBtnText}>Отметить выполненным</Text>
                </>
            }
          </TouchableOpacity>
        )}

        {/* Completed at */}
        {task.completed_at && (
          <Text style={styles.completedAt}>
            Выполнено: {format(new Date(task.completed_at), 'd MMMM yyyy, HH:mm', { locale: ru })}
          </Text>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingBottom: 100, gap: Spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.sm },
  backBtn: { padding: 4 },
  pageTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.foreground, flex: 1 },
  deleteBtn: { padding: 8 },
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.xl,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.lg,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  taskTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.foreground },
  taskDesc: { fontSize: FontSize.md, color: Colors.mutedFg },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.muted, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  tagText: { fontSize: FontSize.sm, color: Colors.mutedFg },
  assigneeRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.muted, borderRadius: Radius.md, padding: Spacing.md,
  },
  assigneeName: { fontSize: FontSize.md, fontWeight: '500', color: Colors.foreground },
  assigneeRole: { fontSize: FontSize.sm, color: Colors.mutedFg },
  sectionLabel: { fontSize: FontSize.md, fontWeight: '500', color: Colors.foreground, marginBottom: 10 },
  statusRow: { flexDirection: 'row', gap: Spacing.sm },
  statusChip: {
    flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.muted,
  },
  statusChipText: { fontSize: FontSize.sm, color: Colors.mutedFg },
  completeBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  completeBtnText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.white },
  completedAt: { fontSize: FontSize.sm, color: Colors.mutedFg, textAlign: 'center' },
})
