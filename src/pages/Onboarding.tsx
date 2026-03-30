import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Sparkles, Users, UserPlus } from 'lucide-react-native'
import Toast from 'react-native-toast-message'
import { base44 } from '../api/base44Client'
import { useFamilyContext } from '../context/FamilyContext'
import { ROLE_LABELS, AVATAR_COLORS, generateInviteCode } from '../lib/utils'
import { Colors, Radius, Spacing, FontSize } from '../lib/theme'

const ROLES = Object.entries(ROLE_LABELS)

export default function Onboarding() {
  const { user, refresh } = useFamilyContext()
  const [tab, setTab]               = useState<'create' | 'join'>('create')
  const [familyName, setFamilyName] = useState('')
  const [displayName, setDisplayName] = useState(user?.full_name ?? '')
  const [role, setRole]             = useState('parent')
  const [joinCode, setJoinCode]     = useState('')
  const [loading, setLoading]       = useState(false)

  const randomColor = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]

  const handleCreate = async () => {
    if (!familyName.trim() || !displayName.trim()) {
      Toast.show({ type: 'error', text1: 'Заполните все поля' })
      return
    }
    setLoading(true)
    const code   = generateInviteCode()
    const family = await base44.entities.Family.create({
      name: familyName, invite_code: code, owner_email: user!.email,
    })
    await base44.entities.FamilyMember.create({
      family_id: family.id, user_email: user!.email, display_name: displayName,
      role, avatar_color: randomColor(), points: 0, tasks_completed: 0, level: 1,
    })
    Toast.show({ type: 'success', text1: `Семья "${familyName}" создана!`, text2: `Код: ${code}` })
    refresh()
    setLoading(false)
  }

  const handleJoin = async () => {
    if (!joinCode.trim() || !displayName.trim()) {
      Toast.show({ type: 'error', text1: 'Заполните все поля' })
      return
    }
    setLoading(true)
    const families = await base44.entities.Family.filter({ invite_code: joinCode.toUpperCase().trim() })
    if (families.length === 0) {
      Toast.show({ type: 'error', text1: 'Семья не найдена', text2: 'Проверьте код' })
      setLoading(false)
      return
    }
    const family = families[0]
    await base44.entities.FamilyMember.create({
      family_id: family.id, user_email: user!.email, display_name: displayName,
      role, avatar_color: randomColor(), points: 0, tasks_completed: 0, level: 1,
    })
    await base44.entities.Notification.create({
      family_id: family.id, user_email: family.owner_email,
      title: 'Новый участник!', message: `${displayName} присоединился к семье`, type: 'family_invite',
    })
    Toast.show({ type: 'success', text1: `Вы в семье "${family.name}"!` })
    refresh()
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.springify()} style={styles.inner}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Sparkles size={32} color={Colors.primary} />
            </View>
            <Text style={styles.appTitle}>СемьяПлан</Text>
            <Text style={styles.subtitle}>Совместное управление семейными делами</Text>
          </View>

          {/* Tab toggle */}
          <View style={styles.tabs}>
            {([['create', Users, 'Создать семью'], ['join', UserPlus, 'Войти']] as any[]).map(
              ([key, Icon, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.tab, tab === key && styles.tabActive]}
                  onPress={() => setTab(key)}
                >
                  <Icon size={16} color={tab === key ? Colors.foreground : Colors.mutedFg} />
                  <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
                </TouchableOpacity>
              )
            )}
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View>
              <Text style={styles.label}>Ваше имя</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Как вас называть?"
                placeholderTextColor={Colors.mutedFg}
              />
            </View>

            {/* Role picker */}
            <View>
              <Text style={styles.label}>Ваша роль</Text>
              <View style={styles.roleRow}>
                {ROLES.map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.roleChip, role === key && styles.roleChipActive]}
                    onPress={() => setRole(key)}
                  >
                    <Text style={[styles.roleText, role === key && styles.roleTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {tab === 'create' ? (
              <View>
                <Text style={styles.label}>Название семьи</Text>
                <TextInput
                  style={styles.input}
                  value={familyName}
                  onChangeText={setFamilyName}
                  placeholder="Например: Семья Ивановых"
                  placeholderTextColor={Colors.mutedFg}
                />
              </View>
            ) : (
              <View>
                <Text style={styles.label}>Код приглашения</Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  value={joinCode}
                  onChangeText={t => setJoinCode(t.toUpperCase())}
                  placeholder="XXXXXX"
                  placeholderTextColor={Colors.mutedFg}
                  maxLength={6}
                  autoCapitalize="characters"
                />
              </View>
            )}

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={tab === 'create' ? handleCreate : handleJoin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.btnText}>
                    {tab === 'create' ? 'Создать семью' : 'Присоединиться'}
                  </Text>
              }
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  inner: { width: '100%' },
  header: { alignItems: 'center', marginBottom: 32 },
  iconWrap: {
    width: 64, height: 64,
    borderRadius: Radius.lg,
    backgroundColor: Colors.violetLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  appTitle: {
    fontSize: FontSize.xxxl, fontWeight: '700', color: Colors.foreground,
  },
  subtitle: {
    fontSize: FontSize.md, color: Colors.mutedFg, marginTop: 8, textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.muted,
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.xl,
    gap: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: 10, borderRadius: Radius.md,
  },
  tabActive: {
    backgroundColor: Colors.card,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  tabText: { fontSize: FontSize.md, color: Colors.mutedFg },
  tabTextActive: { fontWeight: '600', color: Colors.foreground },
  form: { gap: Spacing.lg },
  label: { fontSize: FontSize.sm, color: Colors.mutedFg, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    fontSize: FontSize.md, color: Colors.foreground, backgroundColor: Colors.card,
  },
  codeInput: {
    letterSpacing: 6, fontWeight: '700', fontSize: FontSize.xl, textAlign: 'center',
  },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  roleChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  roleChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  roleText: { fontSize: FontSize.sm, color: Colors.foreground },
  roleTextActive: { color: Colors.white, fontWeight: '600' },
  btn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.white },
})
