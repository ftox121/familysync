import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { ArrowLeft, Star } from 'lucide-react-native'
import Toast from 'react-native-toast-message'
import { base44 } from '../api/base44Client'
import { useFamilyContext } from '../context/FamilyContext'
import { CATEGORY_LABELS, PRIORITY_LABELS, getPointsForPriority } from '../lib/utils'
import { Colors, Radius, Spacing, FontSize } from '../lib/theme'

const CATEGORIES = Object.entries(CATEGORY_LABELS)
const PRIORITIES = Object.entries(PRIORITY_LABELS)

const PRIORITY_COLORS: Record<string, string> = {
  low: Colors.green, medium: Colors.amber, high: Colors.red,
}

export default function AddTask() {
  const router = useRouter()
  const { currentMembership, members, user, refresh } = useFamilyContext()
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo]   = useState('')
  const [priority, setPriority]       = useState('medium')
  const [category, setCategory]       = useState('other')
  const [dueDate, setDueDate]         = useState('')
  const [loading, setLoading]         = useState(false)

  const points = getPointsForPriority(priority)

  const handleSubmit = async () => {
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: 'Введите название задачи' })
      return
    }
    setLoading(true)
    const assignee = members.find(m => m.user_email === assignedTo)
    await base44.entities.Task.create({
      family_id: currentMembership.family_id,
      title: title.trim(),
      description: description.trim(),
      assigned_to: assignedTo || null,
      assigned_name: assignee?.display_name ?? null,
      status: 'pending',
      priority, category,
      due_date: dueDate || null,
      points_reward: points,
    })
    if (assignedTo && assignedTo !== user!.email) {
      await base44.entities.Notification.create({
        family_id: currentMembership.family_id,
        user_email: assignedTo,
        title: 'Новая задача!',
        message: `Вам назначена задача: "${title.trim()}"`,
        type: 'task_assigned',
      })
    }
    Toast.show({ type: 'success', text1: 'Задача создана!' })
    refresh()
    router.back()
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <Animated.View entering={FadeInDown} style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={Colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Новая задача</Text>
        </Animated.View>

        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Название *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Что нужно сделать?"
            placeholderTextColor={Colors.mutedFg}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Описание</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Подробности..."
            placeholderTextColor={Colors.mutedFg}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Категория</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {CATEGORIES.map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, category === key && styles.chipActive]}
                  onPress={() => setCategory(key)}
                >
                  <Text style={[styles.chipText, category === key && styles.chipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Priority */}
        <View style={styles.field}>
          <Text style={styles.label}>Приоритет</Text>
          <View style={styles.chipRow}>
            {PRIORITIES.map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.chip,
                  priority === key && { backgroundColor: PRIORITY_COLORS[key], borderColor: PRIORITY_COLORS[key] },
                ]}
                onPress={() => setPriority(key)}
              >
                <Text style={[styles.chipText, priority === key && { color: Colors.white, fontWeight: '600' }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Assign to */}
        <View style={styles.field}>
          <Text style={styles.label}>Назначить</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[styles.chip, assignedTo === '' && styles.chipActive]}
                onPress={() => setAssignedTo('')}
              >
                <Text style={[styles.chipText, assignedTo === '' && styles.chipTextActive]}>
                  Не назначено
                </Text>
              </TouchableOpacity>
              {members.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.chip, assignedTo === m.user_email && styles.chipActive]}
                  onPress={() => setAssignedTo(m.user_email)}
                >
                  <Text style={[styles.chipText, assignedTo === m.user_email && styles.chipTextActive]}>
                    {m.display_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Due date */}
        <View style={styles.field}>
          <Text style={styles.label}>Дедлайн (ГГГГ-ММ-ДД)</Text>
          <TextInput
            style={styles.input}
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="2025-12-31"
            placeholderTextColor={Colors.mutedFg}
          />
        </View>

        {/* Points info */}
        <View style={styles.pointsBanner}>
          <Star size={16} color={Colors.amber} />
          <Text style={styles.pointsText}>
            Награда за выполнение:{' '}
            <Text style={{ fontWeight: '700', color: Colors.amber }}>{points} баллов</Text>
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.submitText}>Создать задачу</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { padding: Spacing.xl, paddingBottom: 100, gap: Spacing.lg },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.sm },
  backBtn: { padding: 4 },
  pageTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.foreground },
  field: { gap: 6 },
  label: { fontSize: FontSize.sm, color: Colors.mutedFg },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    fontSize: FontSize.md, color: Colors.foreground, backgroundColor: Colors.card,
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.muted,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, color: Colors.mutedFg },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  pointsBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.violetLight, borderRadius: Radius.md, padding: Spacing.md,
  },
  pointsText: { fontSize: FontSize.md, color: Colors.foreground },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 14, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  submitText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.white },
})
