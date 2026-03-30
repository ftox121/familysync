import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import Animated, { FadeIn } from 'react-native-reanimated'
import { useFamilyContext } from '../context/FamilyContext'
import StatsBar from '../components/StatsBar'
import TaskCard from '../components/TaskCard'
import { Colors, Radius, Spacing, FontSize } from '../lib/theme'

const FILTERS = [
  { key: 'all',         label: 'Все' },
  { key: 'pending',     label: 'Ожидают' },
  { key: 'in_progress', label: 'В процессе' },
  { key: 'completed',   label: 'Выполнено' },
]

export default function Tasks() {
  const { tasks, members, family, isLoading } = useFamilyContext()
  const [filter, setFilter] = useState('all')
  const router = useRouter()

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

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
        <Text style={styles.familyName}>{family?.name ?? 'СемьяПлан'}</Text>
        <Text style={styles.pageTitle}>Задачи</Text>
      </Animated.View>

      {/* Stats */}
      <StatsBar tasks={tasks} />

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        <View style={styles.filters}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, filter === f.key && styles.chipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Task list */}
      <View style={styles.list}>
        {filtered.length === 0 ? (
          <Animated.View entering={FadeIn} style={styles.empty}>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'Нет задач. Нажмите + чтобы создать первую!'
                : 'Нет задач с таким статусом'}
            </Text>
          </Animated.View>
        ) : (
          filtered.map((task, i) => (
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
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingBottom: 100, gap: Spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  header: { paddingTop: Spacing.sm },
  familyName: {
    fontSize: FontSize.xs, fontWeight: '600', color: Colors.mutedFg,
    textTransform: 'uppercase', letterSpacing: 1.2,
  },
  pageTitle: {
    fontSize: FontSize.xxxl, fontWeight: '700', color: Colors.foreground, marginTop: 4,
  },
  filtersScroll: { marginHorizontal: -Spacing.xl },
  filters: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xl, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.muted,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, color: Colors.mutedFg },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  list: { gap: Spacing.md },
  empty: { paddingVertical: 48, alignItems: 'center' },
  emptyText: { fontSize: FontSize.md, color: Colors.mutedFg, textAlign: 'center' },
})
