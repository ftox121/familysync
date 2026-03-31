import { useEffect, useState } from 'react'
import { Sparkles, UserPlus, Users } from 'lucide-react-native'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { apiClient } from '../api/apiClient'
import AnimalAvatarPicker from '../components/AnimalAvatarPicker'
import { useFamilyContext } from '../context/FamilyContext'
import { AVATAR_COLORS, generateInviteCode, ROLE_LABELS } from '../lib/utils'
import { showError, showSuccess } from '../lib/toast'
import { colors, spacing } from '../theme'

export default function OnboardingScreen() {
  const { user, refresh } = useFamilyContext()
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState('create')
  const [familyName, setFamilyName] = useState('')
  const [displayName, setDisplayName] = useState(user?.full_name ?? '')
  const [role, setRole] = useState('parent')
  const [animalId, setAnimalId] = useState('cat')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState(null)

  useEffect(() => {
    if (user?.full_name) setDisplayName(d => d || user.full_name)
  }, [user?.full_name])

  const randomColor = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]

  const handleCreate = async () => {
    if (!familyName.trim() || !displayName.trim()) {
      showError('Заполните все поля')
      return
    }
    setLoading(true)
    try {
      const code = generateInviteCode()
      const family = await apiClient.createFamily({
        name: familyName.trim(),
        invite_code: code,
      })

      await apiClient.addFamilyMember(family.id, {
        user_email: user.email,
        display_name: displayName.trim(),
        role,
        avatar_color: randomColor(),
        animal_id: animalId,
      })

      showSuccess(`Семья создана! Код: ${code}`)
      refresh()
    } catch (error) {
      if (String(error?.message || '').toLowerCase().includes('network request failed')) {
        showError('Нет соединения с сервером. Проверьте, запущен ли backend на вашем компьютере.')
      } else {
        showError(error.message || 'Ошибка создания семьи')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!joinCode.trim() || !displayName.trim()) {
      showError('Заполните все поля')
      return
    }
    setLoading(true)
    try {
      const data = await apiClient.joinFamilyByCode({
        invite_code: joinCode.toUpperCase().trim(),
        display_name: displayName.trim(),
        role,
        avatar_color: randomColor(),
        animal_id: animalId,
      })

      showSuccess(`Вы в семье «${data.family?.name || 'Семья'}»!`)
      refresh()
    } catch (error) {
      showError(error.message || 'Ошибка присоединения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* декоративные пятна */}
          <View style={styles.blob1} pointerEvents="none" />
          <View style={styles.blob2} pointerEvents="none" />

          <View style={styles.hero}>
            <View style={styles.iconWrap}>
              <Sparkles size={32} color={colors.onboardAccent} />
            </View>
            <Text style={styles.h1}>СемьяПлан</Text>
            <Text style={styles.sub}>Совместное управление семейными делами</Text>
          </View>

          <View style={styles.tabs}>
            <Pressable
              onPress={() => setTab('create')}
              style={({ pressed }) => [
                styles.tab,
                tab === 'create' ? styles.tabActive : styles.tabInactive,
                pressed && styles.tabPressed,
              ]}
            >
              <Users size={16} color={tab === 'create' ? colors.onboardBg : colors.onboardMuted} />
              <Text style={[styles.tabText, tab === 'create' && styles.tabTextActive]}>Создать</Text>
            </Pressable>
            <Pressable
              onPress={() => setTab('join')}
              style={({ pressed }) => [
                styles.tab,
                tab === 'join' ? styles.tabActive : styles.tabInactive,
                pressed && styles.tabPressed,
              ]}
            >
              <UserPlus size={16} color={tab === 'join' ? colors.onboardBg : colors.onboardMuted} />
              <Text style={[styles.tabText, tab === 'join' && styles.tabTextActive]}>По коду</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Ваше имя</Text>
            <TextInput
              style={[
                styles.input,
                focusedField === 'name' && styles.inputFocused,
                loading && styles.inputDisabled,
              ]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Как вас называть?"
              placeholderTextColor={colors.onboardMuted}
              editable={!loading}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              returnKeyType={tab === 'create' ? 'next' : 'next'}
            />

            {tab === 'create' ? (
              <>
                <Text style={styles.label}>Название семьи</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'family' && styles.inputFocused,
                    loading && styles.inputDisabled,
                  ]}
                  value={familyName}
                  onChangeText={setFamilyName}
                  placeholder="Например: Семья Ивановых"
                  placeholderTextColor={colors.onboardMuted}
                  editable={!loading}
                  onFocus={() => setFocusedField('family')}
                  onBlur={() => setFocusedField(null)}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </>
            ) : null}

            <Text style={styles.label}>Роль в семье</Text>
            <View style={styles.roleRow}>
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <Pressable
                  key={k}
                  onPress={() => !loading && setRole(k)}
                  style={({ pressed }) => [
                    styles.roleChip,
                    role === k && styles.roleChipOn,
                    pressed && styles.roleChipPressed,
                    loading && styles.inputDisabled,
                  ]}
                >
                  <Text style={[styles.roleChipText, role === k && styles.roleChipTextOn]}>{v}</Text>
                </Pressable>
              ))}
            </View>

            <AnimalAvatarPicker selected={animalId} onSelect={setAnimalId} />

            {tab === 'join' ? (
              <>
                <Text style={styles.label}>Код приглашения</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'code' && styles.inputFocused,
                    loading && styles.inputDisabled,
                    styles.mono,
                  ]}
                  value={joinCode}
                  onChangeText={setJoinCode}
                  placeholder="XXXXXX"
                  placeholderTextColor={colors.onboardMuted}
                  autoCapitalize="characters"
                  maxLength={6}
                  editable={!loading}
                  onFocus={() => setFocusedField('code')}
                  onBlur={() => setFocusedField(null)}
                />
              </>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.cta,
                loading && styles.ctaDisabled,
                pressed && !loading && styles.ctaPressed,
              ]}
              onPress={tab === 'create' ? handleCreate : handleJoin}
              disabled={loading}
            >
              <Text style={styles.ctaText}>
                {loading ? (tab === 'create' ? 'Создаём...' : 'Вход...') : tab === 'create' ? 'Создать семью' : 'Присоединиться'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.onboardBg },
  scroll: {
    padding: spacing.screen,
    paddingBottom: 48,
  },
  blob1: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.onboardAccent2,
    opacity: 0.12,
  },
  blob2: {
    position: 'absolute',
    top: 120,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.onboardAccent,
    opacity: 0.1,
  },
  hero: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: colors.onboardSurface2,
    borderWidth: 1,
    borderColor: colors.onboardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  h1: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.onboardText,
    letterSpacing: -0.5,
  },
  sub: { fontSize: 14, color: colors.onboardMuted, marginTop: 8, textAlign: 'center', maxWidth: 280 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.onboardSurface,
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.onboardBorder,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tabInactive: { backgroundColor: 'transparent' },
  tabActive: {
    backgroundColor: colors.onboardAccent,
    shadowColor: colors.onboardAccent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  tabPressed: { opacity: 0.88 },
  tabText: { fontSize: 13, color: colors.onboardMuted, fontWeight: '600' },
  tabTextActive: { color: colors.onboardBg },
  card: {
    backgroundColor: colors.onboardSurface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.onboardBorder,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onboardMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.onboardBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    color: colors.onboardText,
    backgroundColor: colors.onboardSurface2,
    marginBottom: 16,
  },
  inputFocused: {
    borderColor: colors.onboardAccent,
    shadowColor: colors.onboardAccent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  inputDisabled: { opacity: 0.55 },
  mono: { letterSpacing: 6, fontWeight: '700' },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.onboardSurface2,
    borderWidth: 1,
    borderColor: colors.onboardBorder,
  },
  roleChipOn: {
    backgroundColor: 'rgba(34,211,238,0.2)',
    borderColor: colors.onboardAccent,
  },
  roleChipPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  roleChipText: { fontSize: 13, color: colors.onboardMuted, fontWeight: '600' },
  roleChipTextOn: { color: colors.onboardAccent },
  cta: {
    backgroundColor: colors.onboardAccent2,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.5)',
  },
  ctaPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
