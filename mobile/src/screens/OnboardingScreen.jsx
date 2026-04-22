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
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { apiClient } from '../api/apiClient'
import AnimalAvatarPicker from '../components/AnimalAvatarPicker'
import MemberAvatar from '../components/MemberAvatar'
import { useFamilyContext } from '../context/FamilyContext'
import { AVATAR_COLORS, AVATAR_PALETTE, generateInviteCode, ROLE_LABELS } from '../lib/utils'
import { showError, showSuccess } from '../lib/toast'
import { colors, gradients, radius, spacing } from '../theme'

export default function OnboardingScreen() {
  const { user, refresh } = useFamilyContext()
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState('create')
  const [familyName, setFamilyName] = useState('')
  const [displayName, setDisplayName] = useState(user?.full_name ?? '')
  const [role, setRole] = useState('parent')
  const [animalId, setAnimalId] = useState('cat')
  const [avatarColor, setAvatarColor] = useState('violet')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState(null)

  useEffect(() => {
    if (user?.full_name) setDisplayName(d => d || user.full_name)
  }, [user?.full_name])

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
        avatar_color: avatarColor,
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
        avatar_color: avatarColor,
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
    <LinearGradient colors={gradients.screen} style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8 }]}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* decorative blobs */}
          <View style={styles.blob1} pointerEvents="none" />
          <View style={styles.blob2} pointerEvents="none" />

          <View style={styles.hero}>
            <LinearGradient colors={gradients.primary} style={styles.iconWrap}>
              <Sparkles size={28} color="#fff" />
            </LinearGradient>
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
              <Users size={15} color={tab === 'create' ? '#fff' : colors.textMuted} />
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
              <UserPlus size={15} color={tab === 'join' ? '#fff' : colors.textMuted} />
              <Text style={[styles.tabText, tab === 'join' && styles.tabTextActive]}>По коду</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            {/* avatar preview */}
            <View style={styles.avatarPreview}>
              <MemberAvatar
                name={displayName || '?'}
                color={avatarColor}
                animalId={animalId}
                size="xl"
              />
            </View>

            <Text style={styles.label}>Цвет аватара</Text>
            <View style={styles.colorRow}>
              {AVATAR_COLORS.map(c => {
                const pal = AVATAR_PALETTE[c]
                return (
                  <Pressable
                    key={c}
                    onPress={() => setAvatarColor(c)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: pal.bg, borderColor: pal.text },
                      avatarColor === c && styles.colorDotSelected,
                    ]}
                  >
                    {avatarColor === c && (
                      <View style={[styles.colorDotInner, { backgroundColor: pal.text }]} />
                    )}
                  </Pressable>
                )
              })}
            </View>

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
              placeholderTextColor={colors.textMuted}
              editable={!loading}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              returnKeyType="next"
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
                  placeholderTextColor={colors.textMuted}
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
                  placeholderTextColor={colors.textMuted}
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
              <LinearGradient
                colors={gradients.primaryBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaText}>
                  {loading
                    ? tab === 'create' ? 'Создаём...' : 'Вход...'
                    : tab === 'create' ? 'Создать семью' : 'Присоединиться'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
    backgroundColor: colors.primary,
    opacity: 0.08,
  },
  blob2: {
    position: 'absolute',
    top: 140,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.accent,
    opacity: 0.1,
  },
  hero: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  h1: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  sub: { fontSize: 14, color: colors.textSecondary, marginTop: 6, textAlign: 'center', maxWidth: 280 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 4,
    marginBottom: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
    borderRadius: 12,
  },
  tabInactive: { backgroundColor: 'transparent' },
  tabActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  tabPressed: { opacity: 0.88 },
  tabText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.outline,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  avatarPreview: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotSelected: {
    transform: [{ scale: 1.2 }],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  colorDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.outline,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surfaceStrong,
    marginBottom: 16,
  },
  inputFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  inputDisabled: { opacity: 0.55 },
  mono: { letterSpacing: 6, fontWeight: '700' },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1.5,
    borderColor: colors.outline,
  },
  roleChipOn: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  roleChipPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  roleChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  roleChipTextOn: { color: colors.primaryDark },
  cta: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: 8,
  },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaPressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
