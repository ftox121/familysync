import { format, isPast, isToday } from 'date-fns'
import { ru } from 'date-fns/locale'
import { LinearGradient } from 'expo-linear-gradient'
import { ChevronRight, Clock, Sparkles, Star, Users } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { CATEGORY_LABELS, STATUS_LABELS } from '../lib/utils'
import { colors, radius, shadows } from '../theme'
import MemberAvatar from './MemberAvatar'

const PRIORITY = {
  high: { bar: [colors.priorityHigh, '#f87171'], label: 'Высокий' },
  medium: { bar: [colors.priorityMed, '#fbbf24'], label: 'Средний' },
  low: { bar: [colors.priorityLow, '#34d399'], label: 'Низкий' },
}

const STATUS_STYLES = {
  pending: { bg: colors.muted, text: colors.textSecondary },
  in_progress: { bg: colors.priorityMedBg, text: colors.priorityMed },
  pending_confirmation: { bg: colors.primaryMuted, text: colors.primary },
  completed: { bg: colors.successBg, text: colors.success },
}

export default function TaskCard({ task, members, onPress }) {
  const assignee = members?.find(m => m.user_email === task.assigned_to)
  const questParticipants = Array.isArray(task.participants)
    ? task.participants
        .map(p => members?.find(m => m.user_email === p.user_email))
        .filter(Boolean)
    : []
  const isOverdue =
    task.due_date && isPast(new Date(task.due_date)) && task.status !== 'completed'
  const isDueToday = task.due_date && isToday(new Date(task.due_date))
  const isCompleted = task.status === 'completed'
  const pr = PRIORITY[task.priority] ?? PRIORITY.medium
  const st = STATUS_STYLES[task.status] ?? STATUS_STYLES.pending

  return (
    <Pressable
      onPress={() => onPress?.(task)}
      style={({ pressed }) => [
        styles.wrap,
        shadows.card,
        pressed && styles.pressed,
        isCompleted && styles.completedDim,
      ]}
    >
      <LinearGradient
        colors={pr.bar}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.priorityBar}
      />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, isCompleted && styles.titleDone]} numberOfLines={2}>
              {task.title}
            </Text>
            <Text style={styles.priorityPill}>{pr.label}</Text>
          </View>
          {task.points_reward > 0 ? (
            <View style={styles.xpBadge}>
              <Star size={14} color={colors.priorityMed} />
              <Text style={styles.xpText}>{task.points_reward}</Text>
            </View>
          ) : null}
        </View>
        {!!task.description && (
          <Text style={styles.desc} numberOfLines={2}>
            {task.description}
          </Text>
        )}
        <View style={styles.chips}>
          {task.is_quest ? (
            <View style={styles.questChip}>
              <Sparkles size={12} color="#7c3aed" />
              <Text style={styles.questText}>Epic Quest</Text>
            </View>
          ) : null}
          <View style={styles.catChip}>
            <Text style={styles.catText}>{CATEGORY_LABELS[task.category] ?? task.category}</Text>
          </View>
          <View style={[styles.statusChip, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.text }]}>{STATUS_LABELS[task.status]}</Text>
          </View>
        </View>
        <View style={styles.footer}>
          {task.due_date ? (
            <View style={styles.dueRow}>
              <Clock
                size={14}
                color={isOverdue ? colors.danger : isDueToday ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.dueText,
                  isOverdue && { color: colors.danger, fontWeight: '700' },
                  isDueToday && !isOverdue && { color: colors.primary, fontWeight: '700' },
                ]}
              >
                {isOverdue
                  ? 'Просрочено'
                  : isDueToday
                    ? 'Сегодня'
                    : format(new Date(task.due_date), 'd MMMM', { locale: ru })}
              </Text>
            </View>
          ) : (
            <Text style={styles.noDue}>Без срока</Text>
          )}
          <View style={styles.rightMeta}>
            {task.is_quest ? (
              <View style={styles.questParticipants}>
                <Users size={14} color={colors.textMuted} />
                <View style={styles.questAvatars}>
                  {questParticipants.slice(0, 3).map((member, index) => (
                    <View key={member.id} style={{ marginLeft: index === 0 ? 0 : -8 }}>
                      <MemberAvatar name={member.display_name} color={member.avatar_color} animalId={member.animal_id} size="sm" />
                    </View>
                  ))}
                </View>
              </View>
            ) : assignee ? <MemberAvatar name={assignee.display_name} color={assignee.avatar_color} animalId={assignee.animal_id} size="sm" /> : null}
            <ChevronRight size={18} color={colors.textMuted} />
          </View>
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.outline,
    overflow: 'hidden',
    marginBottom: 12,
  },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.95 },
  completedDim: { opacity: 0.7 },
  priorityBar: { width: 6, borderTopLeftRadius: radius.lg, borderBottomLeftRadius: radius.lg },
  body: { flex: 1, padding: 18, gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  titleBlock: { flex: 1, minWidth: 0 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text, letterSpacing: -0.4, lineHeight: 23 },
  titleDone: { textDecorationLine: 'line-through', color: colors.textMuted, fontWeight: '600' },
  priorityPill: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.amberSoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  xpText: { fontSize: 14, fontWeight: '800', color: colors.priorityMed },
  desc: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  catText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  questChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#f3e8ff',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.18)',
  },
  questText: { fontSize: 11, fontWeight: '800', color: '#7c3aed' },
  statusChip: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
  },
  statusText: { fontSize: 11, fontWeight: '800' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
  },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dueText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  noDue: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  rightMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  questParticipants: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  questAvatars: { flexDirection: 'row', alignItems: 'center' },
})
