import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  Bell,
  CheckCheck,
  Clock,
  ListTodo,
  Star,
  UserPlus,
} from 'lucide-react-native'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ScreenBackground from '../components/ScreenBackground'
import { apiClient } from '../api/apiClient'
import { useFamilyContext } from '../context/FamilyContext'
import { colors, radius, shadows, spacing, typography } from '../theme'

const TYPE_CONFIG = {
  task_assigned: { Icon: ListTodo, bg: colors.violetSoft, fg: colors.primary },
  task_completed: { Icon: CheckCheck, bg: colors.greenSoft, fg: colors.green },
  reminder: { Icon: Clock, bg: colors.amberSoft, fg: colors.amber },
  achievement: { Icon: Star, bg: '#ffedd5', fg: colors.orange },
  family_invite: { Icon: UserPlus, bg: '#e0f2fe', fg: colors.sky },
}

export default function NotificationsScreen() {
  const { notifications, refresh, isLoading } = useFamilyContext()
  const insets = useSafeAreaInsets()

  const handleMarkRead = async notif => {
    if (!notif.is_read) {
      await apiClient.markNotificationRead(notif.id, true)
      refresh()
    }
  }

  const handleMarkAllRead = async () => {
    for (const n of notifications.filter(n => !n.is_read)) {
      await apiClient.markNotificationRead(n.id, true)
    }
    refresh()
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (isLoading)
    return (
      <ScreenBackground>
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenBackground>
    )

  return (
    <ScreenBackground>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingTop: insets.top + 12, paddingBottom: 132 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Text style={typography.caption}>Центр активности</Text>
            <View style={styles.header}>
              <View>
                <Text style={typography.hero}>Уведомления</Text>
                {unreadCount > 0 && (
                  <Text style={[typography.subtitle, { marginTop: 6 }]}>
                    {unreadCount} непрочитанных
                  </Text>
                )}
              </View>
              {unreadCount > 0 && (
                <Pressable
                  onPress={handleMarkAllRead}
                  style={({ pressed }) => [styles.markAll, pressed && { opacity: 0.85 }]}
                >
                  <CheckCheck size={16} color={colors.primary} />
                  <Text style={styles.markAllText}>Прочитать все</Text>
                </Pressable>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Bell size={32} color={colors.primary} />
            </View>
            <Text style={styles.emptyText}>Пока тихо — уведомлений нет</Text>
            <Text style={styles.emptyHint}>Новые события появятся здесь</Text>
          </View>
        }
        renderItem={({ item: notif }) => {
          const cfg = TYPE_CONFIG[notif.type] ?? {
            Icon: Bell,
            bg: colors.muted,
            fg: colors.textMuted,
          }
          const Icon = cfg.Icon
          return (
            <Pressable
              onPress={() => handleMarkRead(notif)}
              style={({ pressed }) => [
                styles.row,
                shadows.card,
                notif.is_read ? styles.rowRead : styles.rowUnread,
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
                <Icon size={18} color={cfg.fg} />
              </View>
              <View style={styles.body}>
                <Text style={[styles.title, !notif.is_read && styles.titleBold]} numberOfLines={1}>
                  {notif.title}
                </Text>
                <Text style={styles.msg} numberOfLines={2}>
                  {notif.message}
                </Text>
                <Text style={styles.time}>
                  {notif.created_date
                    ? format(new Date(notif.created_date), 'd MMM, HH:mm', { locale: ru })
                    : ''}
                </Text>
              </View>
              {!notif.is_read && <View style={styles.dot} />}
            </Pressable>
          )
        }}
      />
    </ScreenBackground>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: spacing.screen },
  headerBlock: { marginBottom: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 16,
  },
  markAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  markAllText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    marginBottom: 12,
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.outline,
  },
  rowRead: { opacity: 0.88 },
  rowUnread: {
    borderColor: 'rgba(99,102,241,0.4)',
    backgroundColor: colors.surface,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, color: colors.text, lineHeight: 18, fontWeight: '700' },
  titleBold: { fontWeight: '800' },
  msg: { fontSize: 13, color: colors.textSecondary, marginTop: 5, lineHeight: 18 },
  time: { fontSize: 11, color: colors.textMuted, marginTop: 8, fontWeight: '600' },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
    ...shadows.press,
  },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 16 },
  emptyHint: { fontSize: 13, color: colors.textSecondary, marginTop: 6 },
})
