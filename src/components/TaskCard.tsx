import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { format, isPast, isToday } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Star, Clock, ChevronRight } from 'lucide-react-native'
import { Colors, Radius, Spacing, FontSize } from '../lib/theme'
import { CATEGORY_LABELS, STATUS_LABELS } from '../lib/utils'
import MemberAvatar from './MemberAvatar'

const priorityBorderColor: Record<string, string> = {
  high:   Colors.priorityHigh,
  medium: Colors.priorityMedium,
  low:    Colors.priorityLow,
}

const statusBadge: Record<string, { bg: string; color: string }> = {
  pending:     { bg: Colors.muted,       color: Colors.mutedFg },
  in_progress: { bg: Colors.amberLight,  color: '#92400e' },
  completed:   { bg: Colors.greenLight,  color: '#166534' },
}

interface Props {
  task: any
  members?: any[]
  onPress?: (task: any) => void
  index?: number
}

export default function TaskCard({ task, members, onPress, index = 0 }: Props) {
  const assignee    = members?.find(m => m.user_email === task.assigned_to)
  const isOverdue   = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'completed'
  const isDueToday  = task.due_date && isToday(new Date(task.due_date))
  const isCompleted = task.status === 'completed'

  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  const handlePressIn  = () => { scale.value = withSpring(0.97) }
  const handlePressOut = () => { scale.value = withSpring(1) }

  const badge = statusBadge[task.status] ?? statusBadge.pending

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => onPress?.(task)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View
          style={[
            styles.card,
            { borderLeftColor: priorityBorderColor[task.priority] ?? Colors.border },
            isCompleted && styles.cardCompleted,
          ]}
        >
          <View style={styles.row}>
            <View style={styles.content}>
              {/* Title row */}
              <View style={styles.titleRow}>
                <Text
                  style={[styles.title, isCompleted && styles.titleCompleted]}
                  numberOfLines={1}
                >
                  {task.title}
                </Text>
                {task.points_reward > 0 && (
                  <View style={styles.points}>
                    <Star size={12} color={Colors.amber} />
                    <Text style={styles.pointsText}>{task.points_reward}</Text>
                  </View>
                )}
              </View>

              {/* Description */}
              {task.description ? (
                <Text style={styles.description} numberOfLines={1}>{task.description}</Text>
              ) : null}

              {/* Tags */}
              <View style={styles.tags}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{CATEGORY_LABELS[task.category] ?? task.category}</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.tagText, { color: badge.color }]}>{STATUS_LABELS[task.status]}</Text>
                </View>
                {task.due_date && (
                  <View style={styles.dateTag}>
                    <Clock size={11} color={isOverdue ? Colors.red : isDueToday ? Colors.primary : Colors.mutedFg} />
                    <Text
                      style={[
                        styles.dateText,
                        isOverdue && { color: Colors.red, fontWeight: '600' },
                        isDueToday && { color: Colors.primary, fontWeight: '600' },
                      ]}
                    >
                      {isOverdue ? 'Просрочено' : isDueToday ? 'Сегодня' : format(new Date(task.due_date), 'd MMM', { locale: ru })}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Right side */}
            <View style={styles.right}>
              {assignee && (
                <MemberAvatar name={assignee.display_name} color={assignee.avatar_color} size="sm" />
              )}
              <ChevronRight size={16} color={Colors.mutedFg} style={{ marginTop: 4 }} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 2,
  },
  cardCompleted: {
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.foreground,
    flex: 1,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.mutedFg,
  },
  points: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  pointsText: {
    fontSize: FontSize.xs,
    color: Colors.amber,
    fontWeight: '600',
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.mutedFg,
    marginBottom: Spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tag: {
    backgroundColor: Colors.muted,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: FontSize.xs,
    color: Colors.mutedFg,
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dateText: {
    fontSize: FontSize.xs,
    color: Colors.mutedFg,
  },
  right: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
})
