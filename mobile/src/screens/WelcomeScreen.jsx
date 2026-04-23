import { LinearGradient } from 'expo-linear-gradient'
import {
  ArrowRight,
  CheckCircle2,
  Gift,
  MessageCircle,
  ShieldCheck,
  Users,
} from 'lucide-react-native'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, gradients, radius, shadows, spacing } from '../theme'

const FEATURES = [
  {
    icon: CheckCircle2,
    title: 'Задачи по ролям',
    desc: 'Родители назначают дела, дети видят только свои поручения и прогресс.',
  },
  {
    icon: Gift,
    title: 'Награды за выполнение',
    desc: 'Баллы и семейные награды помогают мотивировать детей без хаоса в чате.',
  },
  {
    icon: MessageCircle,
    title: 'Чат внутри каждой задачи',
    desc: 'Вопросы, уточнения и комментарии хранятся прямо в задаче — ничего не теряется в общем чате.',
  },
]

const STEPS = [
  'Создай семью или войди по коду приглашения',
  'Выбери роль и иконку профиля',
  'Распредели задачи, награды и начни пользоваться',
]

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.screen} style={StyleSheet.absoluteFill} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 28 },
        ]}
      >
        <View style={styles.heroCard}>
          <View style={styles.brandRow}>
            <View style={[styles.logoWrap, shadows.card]}>
              <Users size={28} color={colors.primary} />
            </View>
            <View style={styles.brandTextWrap}>
              <Text style={styles.brandEyebrow}>FamilySync</Text>
              <Text style={styles.brandTitle}>Семейный порядок без лишней рутины</Text>
            </View>
          </View>

          <Text style={styles.heroText}>
            Приложение для семьи: родители назначают задачи, дети зарабатывают звёзды и
            обменивают их на награды. Всё общение остаётся внутри — прямо в задаче.
          </Text>

          <View style={styles.statusPill}>
            <ShieldCheck size={16} color={colors.primary} />
            <Text style={styles.statusPillText}>Разделение ролей: родитель и ребенок</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Что внутри</Text>
          {FEATURES.map(item => {
            const Icon = item.icon
            return (
              <View key={item.title} style={[styles.featureCard, shadows.card]}>
                <View style={styles.featureIconWrap}>
                  <Icon size={20} color={colors.primary} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.featureDesc}>{item.desc}</Text>
                </View>
              </View>
            )
          })}
        </View>

        <View style={[styles.sectionCard, shadows.card]}>
          <Text style={styles.sectionTitle}>Как начать</Text>
          {STEPS.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.sectionCard, shadows.card]}>
          <Text style={styles.sectionTitle}>Подходит для</Text>
          <Text style={styles.audienceText}>Семей с детьми, где важно не просто вести список дел, а выстроить понятную систему: кто назначает, кто выполняет и что получает в награду. Подходит для семей с детьми любого возраста.</Text>
        </View>

        <Pressable
          onPress={() => navigation.navigate('Onboarding')}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Перейти к настройке семьи</Text>
            <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gradientStart },
  scroll: { paddingHorizontal: spacing.screen },
  heroCard: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.outline,
    padding: 20,
    marginBottom: 16,
  },
  brandRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  logoWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTextWrap: { flex: 1 },
  brandEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  brandTitle: { fontSize: 24, fontWeight: '800', color: colors.text, lineHeight: 30 },
  heroText: { fontSize: 15, lineHeight: 23, color: colors.textSecondary, marginTop: 18 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
  },
  statusPillText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 12 },
  featureCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1.5,
    borderColor: colors.outline,
    marginBottom: 10,
  },
  featureIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  featureDesc: { fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  sectionCard: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.outline,
    padding: 16,
    marginBottom: 16,
  },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepBadgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 14, lineHeight: 21, color: colors.textSecondary },
  audienceText: { fontSize: 14, lineHeight: 22, color: colors.textSecondary },
  button: { borderRadius: radius.lg, overflow: 'hidden', ...shadows.press },
  buttonPressed: { transform: [{ scale: 0.985 }], opacity: 0.95 },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
})
