import { useMemo, useState, useRef, useCallback } from 'react'
import { Search, SlidersHorizontal, UserRound, CalendarDays, ListTodo } from 'lucide-react-native'
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ScreenBackground from '../components/ScreenBackground'
import StatsBar from '../components/StatsBar'
import TaskCard from '../components/TaskCard'
import TaskCalendarView from '../components/TaskCalendarView'
import { useFamilyContext } from '../context/FamilyContext'
import { useTabBar } from '../context/TabBarContext'
import { colors, radius, typography, shadows } from '../theme'

const FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'pending', label: 'Ожидают' },
  { key: 'in_progress', label: 'В процессе' },
  { key: 'pending_confirmation', label: 'Проверка' },
  { key: 'completed', label: 'Готово' },
]

const SORT_OPTIONS = [
  { value: 'created', label: 'Сначала новые' },
  { value: 'due_asc', label: 'Срок ближе' },
  { value: 'due_desc', label: 'Срок дальше' },
  { value: 'priority', label: 'По важности' },
]

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 }

const VIEW_LIST = 'list'
const VIEW_CALENDAR = 'calendar'

export default function TasksScreen({ navigation }) {
  const { tasks, members, family, user, isLoading } = useFamilyContext()
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [mineOnly, setMineOnly] = useState(false)
  const [sortBy, setSortBy] = useState('created')
  const [viewMode, setViewMode] = useState(VIEW_LIST)
  const insets = useSafeAreaInsets()
  const { handleScroll } = useTabBar()
  const slideAnim = useRef(new Animated.Value(0)).current

  const q = query.trim().toLowerCase()

  const handleViewChange = useCallback((mode) => {
    if (mode === viewMode) return
    Animated.timing(slideAnim, {
      toValue: mode === VIEW_CALENDAR ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start()
    setViewMode(mode)
  }, [viewMode, slideAnim])

  const filtered = useMemo(() => {
    let list = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)
    if (mineOnly && user?.email) list = list.filter(t => t.assigned_to === user.email)
    if (q)
      list = list.filter(
        t =>
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q))
      )

    const sorted = [...list]
    const dueTs = t => (t.due_date ? new Date(t.due_date).getTime() : Number.POSITIVE_INFINITY)

    if (sortBy === 'created')
      sorted.sort((a, b) => String(b.created_date || '').localeCompare(String(a.created_date || '')))
    else if (sortBy === 'due_asc') sorted.sort((a, b) => dueTs(a) - dueTs(b))
    else if (sortBy === 'due_desc') sorted.sort((a, b) => dueTs(b) - dueTs(a))
    else if (sortBy === 'priority')
      sorted.sort(
        (a, b) =>
          (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9) ||
          dueTs(a) - dueTs(b)
      )

    return sorted
  }, [tasks, filter, mineOnly, user?.email, q, sortBy])

  if (isLoading)
    return (
      <ScreenBackground>
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenBackground>
    )

  const emptyText =
    q || mineOnly
      ? 'Ничего не нашлось. Измените поиск или фильтры.'
      : filter === 'all'
        ? 'Задач пока нет. Нажмите «Добавить» внизу!'
        : 'Нет задач в этом статусе'

  // Animated indicator position for the view toggle
  const indicatorTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1], // will be multiplied in style
  })

  const renderHeader = () => (
    <>
      <Text style={styles.familyLabel}>{family?.name ?? 'СемьяПлан'}</Text>
      <Text style={typography.hero}>Задачи</Text>
      <Text style={[typography.subtitle, styles.sub]}>Распределяйте дела вместе — спокойно и понятно</Text>
      <View style={{ height: 16 }} />

      {/* View Mode Toggle */}
      <View style={[styles.toggleWrap, shadows.press]}>
        <Animated.View
          style={[
            styles.toggleIndicator,
            {
              left: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['2%', '50%'],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={['#c084fc', '#f9a8d4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.toggleIndicatorGradient}
          />
        </Animated.View>

        <Pressable
          style={styles.toggleBtn}
          onPress={() => handleViewChange(VIEW_LIST)}
        >
          <ListTodo size={16} color={viewMode === VIEW_LIST ? '#fff' : colors.textMuted} />
          <Text style={[styles.toggleText, viewMode === VIEW_LIST && styles.toggleTextActive]}>
            Список
          </Text>
        </Pressable>

        <Pressable
          style={styles.toggleBtn}
          onPress={() => handleViewChange(VIEW_CALENDAR)}
        >
          <CalendarDays size={16} color={viewMode === VIEW_CALENDAR ? '#fff' : colors.textMuted} />
          <Text style={[styles.toggleText, viewMode === VIEW_CALENDAR && styles.toggleTextActive]}>
            Календарь
          </Text>
        </Pressable>
      </View>
      <View style={{ height: 16 }} />

      {viewMode === VIEW_LIST && (
        <>
          <StatsBar tasks={tasks} />
          <View style={{ height: 18 }} />
          <View style={styles.searchShell}>
            <Search size={20} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.search}
              value={query}
              onChangeText={setQuery}
              placeholder="Поиск по названию или описанию…"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.toolbar}>
            <Pressable
              onPress={() => setMineOnly(v => !v)}
              style={({ pressed }) => [
                styles.mineBtn,
                mineOnly && styles.mineBtnOn,
                pressed && styles.btnPress,
              ]}
            >
              <UserRound size={17} color={mineOnly ? '#fff' : colors.primary} />
              <Text style={[styles.mineBtnText, mineOnly && styles.mineBtnTextOn]}>Мои</Text>
            </Pressable>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
              <View style={styles.sortInner}>
                <SlidersHorizontal size={14} color={colors.textMuted} style={{ marginRight: 6 }} />
                {SORT_OPTIONS.map(o => (
                  <Pressable
                    key={o.value}
                    onPress={() => setSortBy(o.value)}
                    style={({ pressed }) => [
                      styles.sortChip,
                      sortBy === o.value && styles.sortChipOn,
                      pressed && styles.btnPress,
                    ]}
                  >
                    <Text style={[styles.sortChipText, sortBy === o.value && styles.sortChipTextOn]}>
                      {o.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterInner}
          >
            {FILTERS.map(f => (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={({ pressed }) => [
                  styles.filterChip,
                  filter === f.key && styles.filterChipOn,
                  pressed && styles.btnPress,
                ]}
              >
                <Text style={[styles.filterText, filter === f.key && styles.filterTextOn]}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={styles.sectionKicker}>Список</Text>
        </>
      )}

      {viewMode === VIEW_CALENDAR && (
        <TaskCalendarView
          tasks={tasks}
          members={members}
          navigation={navigation}
        />
      )}
    </>
  )

  return (
    <ScreenBackground>
      {viewMode === VIEW_LIST ? (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: insets.top + 12, paddingBottom: 132 },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ListHeaderComponent={renderHeader()}
          ListEmptyComponent={<Text style={styles.empty}>{emptyText}</Text>}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              members={members}
              onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
            />
          )}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: insets.top + 12, paddingBottom: 132 },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {renderHeader()}
        </ScrollView>
      )}
    </ScreenBackground>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 20 },
  familyLabel: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: 6,
  },
  sub: { marginTop: 6, marginBottom: 0, maxWidth: 320 },

  /* View Mode Toggle */
  toggleWrap: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.outline,
    padding: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  toggleIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '48%',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  toggleIndicatorGradient: {
    flex: 1,
    borderRadius: radius.md,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    zIndex: 1,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: '800',
  },

  /* Search & Filters (list mode) */
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.outline,
    paddingLeft: 16,
    paddingRight: 10,
    minHeight: 54,
    marginBottom: 6,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  searchIcon: { marginRight: 10 },
  search: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 14, fontWeight: '600' },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  mineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1.5,
    borderColor: colors.outline,
  },
  mineBtnOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  mineBtnText: { fontSize: 13, fontWeight: '800', color: colors.textSecondary },
  mineBtnTextOn: { color: '#fff' },
  btnPress: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  sortScroll: { flex: 1 },
  sortInner: { flexDirection: 'row', alignItems: 'center', paddingRight: 8 },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1.5,
    borderColor: colors.outline,
    marginRight: 8,
  },
  sortChipOn: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  sortChipText: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  sortChipTextOn: { color: colors.primary, fontWeight: '800' },
  filterScroll: { marginTop: 14 },
  filterInner: { gap: 10, paddingVertical: 4 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1.5,
    borderColor: colors.outline,
    marginRight: 8,
  },
  filterChipOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  filterText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  filterTextOn: { color: '#fff', fontWeight: '800' },
  sectionKicker: {
    marginTop: 22,
    marginBottom: 14,
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  empty: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 15,
    paddingVertical: 60,
    lineHeight: 24,
    fontWeight: '600',
  },
})
