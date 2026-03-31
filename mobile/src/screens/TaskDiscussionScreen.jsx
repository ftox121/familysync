import { ArrowLeft, MessageCircle } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ScreenBackground from '../components/ScreenBackground'
import TaskChat from '../components/TaskChat'
import { colors, spacing, typography } from '../theme'

export default function TaskDiscussionScreen({ navigation, route }) {
  const insets = useSafeAreaInsets()
  const { taskId, title } = route.params || {}

  return (
    <ScreenBackground>
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}> 
        <View style={styles.top}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={typography.caption}>Обсуждение задачи</Text>
            <Text style={styles.title} numberOfLines={1}>{title || 'Задача'}</Text>
          </View>
          <View style={styles.iconWrap}>
            <MessageCircle size={18} color={colors.primary} />
          </View>
        </View>

        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Контекст задачи</Text>
          <Text style={styles.introText}>
            Договаривайтесь по срокам, уточняйте детали и оставляйте важные комментарии прямо здесь.
          </Text>
        </View>

        <TaskChat taskId={taskId} fullScreen />
      </View>
    </ScreenBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.screen },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 2 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  introTitle: { fontSize: 13, fontWeight: '800', color: colors.text, marginBottom: 4 },
  introText: { fontSize: 12, lineHeight: 18, color: colors.textSecondary },
})
