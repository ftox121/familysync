import { useMemo, useState } from 'react'
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ScreenBackground from '../components/ScreenBackground'
import TaskCard from '../components/TaskCard'
import { useFamilyContext } from '../context/FamilyContext'
import { colors, radius, shadows, spacing, typography } from '../theme'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default function CalendarScreen({ navigation }) {
  const { tasks, members, isLoading } = useFamilyContext()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMonth, setViewMonth] = useState(new Date())
  const insets = useSafeAreaInsets()

  const monthDays = useMemo(() => {
    const start = startOfMonth(viewMonth)
    const end = endOfMonth(viewMonth)
    const days = eachDayOfInterval({ start, end })
    const padStart = (getDay(start) + 6) % 7
    return { days, padStart }
  }, [viewMonth])

  const taskDates = useMemo(() => {
    const set = new Set()
    tasks.forEach(t => {
      if (t.due_date) set.add(t.due_date)
    })
    return set
  }, [tasks])

  const dayTasks = useMemo(
    () => tasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), selectedDate)),
    [tasks, selectedDate]
  )

  if (isLoading)
    return (
      <ScreenBackground>
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenBackground>
    )

  const winW = Dimensions.get('window').width
  const cellSize = Math.floor((winW - spacing.screen * 2 - 36) / 7)

  const gridCells = [
    ...Array.from({ length: monthDays.padStart }, (_, i) => ({ type: 'pad', key: `p${i}` })),
    ...monthDays.days.map(day => ({
      type: 'day',
      key: format(day, 'yyyy-MM-dd'),
      day,
    })),
  ]

  return (
    <ScreenBackground>
      <FlatList
        data={dayTasks}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 132, paddingHorizontal: spacing.screen }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={{ paddingTop: insets.top + 12 }}>
              <Text style={typography.caption}>Планирование</Text>
              <Text style={typography.hero}>Календарь</Text>
              <Text style={[typography.subtitle, { marginTop: 6 }]}>Дедлайны и загрузка по дням</Text>
            </View>
            <View style={[styles.card, shadows.card]}>
              <View style={styles.monthRow}>
                <Pressable
                  onPress={() => setViewMonth(m => subMonths(m, 1))}
                  hitSlop={8}
                  style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.75 }]}
                >
                  <ChevronLeft size={22} color={colors.text} />
                </Pressable>
                <Text style={styles.monthTitle}>{format(viewMonth, 'LLLL yyyy', { locale: ru })}</Text>
                <Pressable
                  onPress={() => setViewMonth(m => addMonths(m, 1))}
                  hitSlop={8}
                  style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.75 }]}
                >
                  <ChevronRight size={22} color={colors.text} />
                </Pressable>
              </View>
              <Pressable
                style={({ pressed }) => [styles.todayBtn, pressed && { opacity: 0.9 }]}
                onPress={() => {
                  const today = new Date()
                  setViewMonth(today)
                  setSelectedDate(today)
                }}
              >
                <Text style={styles.todayBtnText}>Сегодня</Text>
              </Pressable>
              <View style={styles.weekRow}>
                {WEEKDAYS.map(d => (
                  <Text key={d} style={styles.weekday}>
                    {d}
                  </Text>
                ))}
              </View>
              <View style={[styles.grid, { width: cellSize * 7 }]}>
                {gridCells.map(cell =>
                  cell.type === 'pad' ? (
                    <View key={cell.key} style={[styles.cell, { width: cellSize, height: cellSize }]} />
                  ) : (
                    <Pressable
                      key={cell.key}
                      onPress={() => setSelectedDate(cell.day)}
                      style={({ pressed }) => [
                        styles.cell,
                        styles.dayCell,
                        { width: cellSize, height: cellSize },
                        isSameDay(cell.day, selectedDate) && styles.daySelected,
                        pressed && !isSameDay(cell.day, selectedDate) && { opacity: 0.85 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNum,
                          isSameDay(cell.day, selectedDate) && styles.dayNumSelected,
                          taskDates.has(cell.key) &&
                            !isSameDay(cell.day, selectedDate) &&
                            styles.dayHasTask,
                        ]}
                      >
                        {format(cell.day, 'd')}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>
            </View>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{format(selectedDate, 'd MMMM yyyy', { locale: ru })}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{dayTasks.length} задач</Text>
              </View>
            </View>
            {dayTasks.length === 0 ? <Text style={styles.noTasks}>Нет задач на этот день</Text> : null}
          </>
        }
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            members={members}
            onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
          />
        )}
      />
    </ScreenBackground>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    marginTop: 22,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 14,
    marginBottom: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  todayBtnText: { fontSize: 13, fontWeight: '800', color: colors.primary },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    paddingVertical: 6,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'center' },
  cell: {},
  dayCell: { alignItems: 'center', justifyContent: 'center' },
  daySelected: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  dayNum: { fontSize: 13, fontWeight: '600', color: colors.text },
  dayNumSelected: { color: '#fff', fontWeight: '800' },
  dayHasTask: { fontWeight: '900', color: colors.primary, textDecorationLine: 'underline' },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 26,
    marginBottom: 14,
  },
  dayTitle: { fontSize: 16, fontWeight: '800', color: colors.text, textTransform: 'capitalize' },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  countText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  noTasks: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 15,
    paddingVertical: 24,
    fontWeight: '500',
  },
})
