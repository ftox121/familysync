import React, { useState, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import Animated, { FadeIn } from 'react-native-reanimated'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import {
  format, isSameDay, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, addMonths, subMonths,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import { useFamilyContext } from '../context/FamilyContext'
import TaskCard from '../components/TaskCard'
import { Colors, Radius, Spacing, FontSize } from '../lib/theme'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default function CalendarView() {
  const { tasks, members, isLoading } = useFamilyContext()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMonth, setViewMonth]       = useState(new Date())
  const router = useRouter()

  const { days, padStart } = useMemo(() => {
    const start = startOfMonth(viewMonth)
    const end   = endOfMonth(viewMonth)
    const days  = eachDayOfInterval({ start, end })
    const padStart = (getDay(start) + 6) % 7
    return { days, padStart }
  }, [viewMonth])

  const taskDates = useMemo(() => {
    const set = new Set<string>()
    tasks.forEach(t => { if (t.due_date) set.add(t.due_date) })
    return set
  }, [tasks])

  const dayTasks = useMemo(
    () => tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), selectedDate)),
    [tasks, selectedDate]
  )

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Animated.View entering={FadeIn} style={styles.header}>
        <Text style={styles.pageTitle}>Календарь</Text>
        <Text style={styles.subtitle}>Планируйте задачи по дням</Text>
      </Animated.View>

      {/* Calendar card */}
      <View style={styles.calCard}>
        {/* Month nav */}
        <View style={styles.monthNav}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => setViewMonth(m => subMonths(m, 1))}
          >
            <ChevronLeft size={20} color={Colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>
            {format(viewMonth, 'LLLL yyyy', { locale: ru })}
          </Text>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => setViewMonth(m => addMonths(m, 1))}
          >
            <ChevronRight size={20} color={Colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Weekday headers */}
        <View style={styles.weekRow}>
          {WEEKDAYS.map(d => (
            <Text key={d} style={styles.weekDay}>{d}</Text>
          ))}
        </View>

        {/* Day grid */}
        <View style={styles.grid}>
          {Array.from({ length: padStart }).map((_, i) => (
            <View key={`pad-${i}`} style={styles.dayCell} />
          ))}
          {days.map(day => {
            const dateStr    = format(day, 'yyyy-MM-dd')
            const isSelected = isSameDay(day, selectedDate)
            const hasTask    = taskDates.has(dateStr)
            const isToday    = isSameDay(day, new Date())

            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                  !isSelected && isToday && styles.dayCellToday,
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <Text style={[
                  styles.dayText,
                  isSelected && styles.dayTextSelected,
                  !isSelected && isToday && styles.dayTextToday,
                  hasTask && !isSelected && styles.dayTextHasTask,
                ]}>
                  {format(day, 'd')}
                </Text>
                {hasTask && !isSelected && (
                  <View style={styles.dot} />
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Day tasks */}
      <View>
        <View style={styles.dayHeader}>
          <Text style={styles.dayTitle}>
            {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{dayTasks.length} задач</Text>
          </View>
        </View>

        <View style={styles.list}>
          {dayTasks.length === 0 ? (
            <Animated.View entering={FadeIn} style={styles.empty}>
              <Text style={styles.emptyText}>Нет задач на этот день</Text>
            </Animated.View>
          ) : (
            dayTasks.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                members={members}
                index={i}
                onPress={() => router.push(`/task/${task.id}`)}
              />
            ))
          )}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingBottom: 100, gap: Spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  header: { paddingTop: Spacing.sm },
  pageTitle: { fontSize: FontSize.xxxl, fontWeight: '700', color: Colors.foreground },
  subtitle: { fontSize: FontSize.md, color: Colors.mutedFg, marginTop: 4 },

  calCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  navBtn: { padding: 6, borderRadius: Radius.sm, backgroundColor: Colors.muted },
  monthLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.foreground, textTransform: 'capitalize' },

  weekRow: { flexDirection: 'row', marginBottom: Spacing.sm },
  weekDay: { flex: 1, textAlign: 'center', fontSize: FontSize.xs, color: Colors.mutedFg },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  dayCellSelected: { backgroundColor: Colors.primary },
  dayCellToday: { backgroundColor: Colors.violetLight },
  dayText: { fontSize: FontSize.sm, color: Colors.foreground },
  dayTextSelected: { color: Colors.white, fontWeight: '700' },
  dayTextToday: { color: Colors.primary, fontWeight: '700' },
  dayTextHasTask: { fontWeight: '700' },
  dot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: Colors.primary, marginTop: 2,
  },

  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  dayTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.foreground, textTransform: 'capitalize' },
  countBadge: {
    backgroundColor: Colors.muted, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  countText: { fontSize: FontSize.sm, color: Colors.mutedFg },
  list: { gap: Spacing.md },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: FontSize.md, color: Colors.mutedFg },
})
