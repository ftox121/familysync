import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import {
  format,
  isSameDay,
  isToday,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isSameMonth,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarDays, Inbox } from 'lucide-react-native'
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import TaskCard from './TaskCard'
import { colors, radius, shadows, spacing, typography } from '../theme'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default function TaskCalendarView({ tasks, members, navigation }) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMonth, setViewMonth] = useState(new Date())
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start()
  }, [])

  // Build grid days for the month (including leading/trailing days from adjacent months)
  const gridData = useMemo(() => {
    const monthStart = startOfMonth(viewMonth)
    const monthEnd = endOfMonth(viewMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    const allDays = eachDayOfInterval({ start: calStart, end: calEnd })
    return allDays.map(day => ({
      day,
      key: format(day, 'yyyy-MM-dd'),
      isCurrentMonth: isSameMonth(day, viewMonth),
      isToday: isToday(day),
    }))
  }, [viewMonth])

  // Map dates → task count for dots
  const taskCountByDate = useMemo(() => {
    const map = {}
    tasks.forEach(t => {
      if (t.due_date) {
        const key = format(new Date(t.due_date), 'yyyy-MM-dd')
        map[key] = (map[key] || 0) + 1
      }
    })
    return map
  }, [tasks])

  // Tasks for selected date
  const dayTasks = useMemo(
    () => tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), selectedDate)),
    [tasks, selectedDate]
  )

  const goToToday = useCallback(() => {
    const today = new Date()
    setViewMonth(today)
    setSelectedDate(today)
  }, [])

  const winW = Dimensions.get('window').width
  const cellSize = Math.floor((winW - spacing.screen * 2 - 24) / 7)

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {/* Calendar Card */}
      <View style={[styles.card, shadows.card]}>
        {/* Month Navigation */}
        <View style={styles.monthRow}>
          <Pressable
            onPress={() => setViewMonth(m => subMonths(m, 1))}
            hitSlop={12}
            style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] }]}
          >
            <ChevronLeft size={20} color={colors.text} />
          </Pressable>

          <View style={styles.monthCenter}>
            <Text style={styles.monthTitle}>
              {format(viewMonth, 'LLLL yyyy', { locale: ru })}
            </Text>
          </View>

          <Pressable
            onPress={() => setViewMonth(m => addMonths(m, 1))}
            hitSlop={12}
            style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.7, transform: [{ scale: 0.92 }] }]}
          >
            <ChevronRight size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Today Button */}
        <Pressable
          style={({ pressed }) => [styles.todayBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
          onPress={goToToday}
        >
          <CalendarDays size={14} color={colors.primary} />
          <Text style={styles.todayBtnText}>Сегодня</Text>
        </Pressable>

        {/* Weekday Headers */}
        <View style={styles.weekRow}>
          {WEEKDAYS.map((d, i) => (
            <View key={d} style={[styles.weekdayCell, { width: cellSize }]}>
              <Text style={[styles.weekday, (i === 5 || i === 6) && styles.weekdayWeekend]}>
                {d}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={[styles.grid, { width: cellSize * 7 }]}>
          {gridData.map(cell => {
            const isSelected = isSameDay(cell.day, selectedDate)
            const taskCount = taskCountByDate[cell.key] || 0
            const hasTask = taskCount > 0

            return (
              <Pressable
                key={cell.key}
                onPress={() => setSelectedDate(cell.day)}
                style={({ pressed }) => [
                  styles.dayCell,
                  { width: cellSize, height: cellSize + 6 },
                  pressed && !isSelected && { opacity: 0.7 },
                ]}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={['#c084fc', '#f9a8d4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.selectedBg}
                  >
                    <Text style={styles.dayNumSelected}>{format(cell.day, 'd')}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[
                    styles.dayInner,
                    cell.isToday && styles.todayHighlight,
                  ]}>
                    <Text
                      style={[
                        styles.dayNum,
                        !cell.isCurrentMonth && styles.dayNumOtherMonth,
                        cell.isToday && styles.dayNumToday,
                        hasTask && cell.isCurrentMonth && styles.dayNumHasTask,
                      ]}
                    >
                      {format(cell.day, 'd')}
                    </Text>
                  </View>
                )}

                {/* Task dots */}
                {hasTask && !isSelected && (
                  <View style={styles.dotRow}>
                    {taskCount >= 1 && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
                    {taskCount >= 2 && <View style={[styles.dot, { backgroundColor: colors.accent }]} />}
                    {taskCount >= 3 && <View style={[styles.dot, { backgroundColor: colors.accent2 }]} />}
                  </View>
                )}
                {isSelected && hasTask && (
                  <View style={styles.dotRow}>
                    <View style={[styles.dot, { backgroundColor: '#fff' }]} />
                  </View>
                )}
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* Selected Day Header */}
      <View style={styles.dayHeader}>
        <View>
          <Text style={styles.dayTitle}>
            {format(selectedDate, 'd MMMM, EEEE', { locale: ru })}
          </Text>
          {isToday(selectedDate) && (
            <Text style={styles.todayLabel}>Сегодня</Text>
          )}
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {dayTasks.length} {dayTasks.length === 1 ? 'задача' : dayTasks.length < 5 ? 'задачи' : 'задач'}
          </Text>
        </View>
      </View>

      {/* Tasks for selected day */}
      {dayTasks.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Inbox size={40} color={colors.textMuted} style={{ marginBottom: 12 }} />
          <Text style={styles.noTasks}>Нет задач на этот день</Text>
          <Text style={styles.noTasksSub}>
            Выберите другой день или добавьте новую задачу
          </Text>
        </View>
      ) : (
        dayTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            members={members}
            onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
          />
        ))
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginTop: 18,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthCenter: {
    flex: 1,
    alignItems: 'center',
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'capitalize',
    letterSpacing: -0.3,
  },
  todayBtn: {
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.outline,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todayBtnText: { fontSize: 13, fontWeight: '800', color: colors.primary },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekdayCell: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  weekday: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  weekdayWeekend: {
    color: colors.accent,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'center',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  dayInner: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBg: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  todayHighlight: {
    backgroundColor: colors.primaryMuted,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  dayNum: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  dayNumOtherMonth: {
    color: colors.textMuted,
    opacity: 0.4,
  },
  dayNumToday: {
    fontWeight: '800',
    color: colors.primary,
  },
  dayNumSelected: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  dayNumHasTask: {
    fontWeight: '800',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 1,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 14,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'capitalize',
    letterSpacing: -0.3,
  },
  todayLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noTasks: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },
  noTasksSub: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 6,
  },
})
