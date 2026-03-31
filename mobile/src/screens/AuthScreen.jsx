import { useState } from 'react'
import { Lock, Mail, User, Sparkles } from 'lucide-react-native'
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
import ScreenBackground from '../components/ScreenBackground'
import { useFamilyContext } from '../context/FamilyContext'
import { showError, showSuccess } from '../lib/toast'
import { colors, radius, shadows, spacing } from '../theme'

export default function AuthScreen() {
  const insets = useSafeAreaInsets()
  const { reloadUser } = useFamilyContext()
  const [mode, setMode] = useState('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim() || (mode === 'register' && !fullName.trim())) {
      showError('Заполните все поля')
      return
    }

    setLoading(true)
    try {
      if (mode === 'register') {
        await apiClient.register(email.trim().toLowerCase(), password, fullName.trim())
        showSuccess('Аккаунт создан')
      } else {
        await apiClient.login(email.trim().toLowerCase(), password)
        showSuccess('Вход выполнен')
      }
      reloadUser()
    } catch (error) {
      showError(error.message || 'Ошибка авторизации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 28 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View style={[styles.logo, shadows.card]}>
              <Sparkles size={32} color={colors.primary} />
            </View>
            <Text style={styles.title}>FamilySync</Text>
            <Text style={styles.subtitle}>Семейные задачи, награды и общение в одном приложении</Text>
          </View>

          <View style={[styles.card, shadows.card]}>
            <View style={styles.tabs}>
              <Pressable onPress={() => setMode('login')} style={[styles.tab, mode === 'login' && styles.tabActive]}>
                <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Вход</Text>
              </Pressable>
              <Pressable onPress={() => setMode('register')} style={[styles.tab, mode === 'register' && styles.tabActive]}>
                <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>Регистрация</Text>
              </Pressable>
            </View>

            {mode === 'register' ? (
              <View style={styles.inputWrap}>
                <User size={18} color={colors.textMuted} />
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Ваше имя"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
              </View>
            ) : null}

            <View style={styles.inputWrap}>
              <Mail size={18} color={colors.textMuted} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="Email"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            </View>

            <View style={styles.inputWrap}>
              <Lock size={18} color={colors.textMuted} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Пароль"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            </View>

            <Pressable onPress={handleSubmit} disabled={loading} style={({ pressed }) => [styles.submit, pressed && { opacity: 0.9 }, loading && { opacity: 0.7 }]}>
              <Text style={styles.submitText}>{loading ? 'Подождите...' : mode === 'register' ? 'Создать аккаунт' : 'Войти'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.screen, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: 28 },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1.5,
    borderColor: colors.outline,
    marginBottom: 16,
  },
  title: { fontSize: 30, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, lineHeight: 22, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
  card: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1.5,
    borderColor: colors.outline,
  },
  tabs: { flexDirection: 'row', backgroundColor: colors.muted, borderRadius: radius.full, padding: 4, marginBottom: 18 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.full },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  tabTextActive: { color: '#fff' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.text },
  submit: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '800' },
})
