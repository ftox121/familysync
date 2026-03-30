import React from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native'
import Animated, { FadeIn, FadeInLeft } from 'react-native-reanimated'
import { Bell, ListTodo, CheckCheck, Clock, Star, UserPlus } from 'lucide-react-native'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { base44 } from '../api/base44Client'
import { useFamilyContext } from '../context/FamilyContext'
import { Colors, Radius, Spacing, FontSize } from '../lib/theme'

const TYPE_CONFIG: Record<string, { icon: any; bg: string; color: string }> = {
  task_assigned:  { icon: ListTodo,  bg: Colors.violetLight, color: Colors.primary },
  task_completed: { icon: CheckCheck,bg: Colors.greenLight,  color: Colors.green },
  reminder:       { icon: Clock,     bg: Colors.amberLight,  color: Colors.amber },
  achievement:    { icon: Star,      bg: '#ffedd5',          color: '#ea580c' },
  family_invite:  { icon: UserPlus,  bg: '#e0f2fe',          color: '#0284c7' },
}

export default function Notifications() {
  const { notifications, refresh, isLoading } = useFamilyContext()

  const handleMarkRead = async (notif: any) => {
    if (!notif.is_read) {
      await base44.entities.Notification.update(notif.id, { is_read: true })
      refresh()
    }
  }

  const handleMarkAllRead = async () => {
    for (const n of notifications.filter((n: any) => !n.is_read)) {
      await base44.entities.Notification.update(n.id, { is_read: true })
    }
    refresh()
  }

  const unreadCount = notifications.filter((n: any) => !n.is_read).length

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
        <View>
          <Text style={styles.pageTitle}>Уведомления</Text>
          {unreadCount > 0 && (
            <Text style={styles.subtitle}>{unreadCount} непрочитанных</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.readAllBtn} onPress={handleMarkAllRead}>
            <CheckCheck size={16} color={Colors.mutedFg} />
            <Text style={styles.readAllText}>Прочитать все</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* List */}
      <View style={styles.list}>
        {notifications.length === 0 ? (
          <Animated.View entering={FadeIn} style={styles.empty}>
            <Bell size={40} color={Colors.border} />
            <Text style={styles.emptyText}>Нет уведомлений</Text>
          </Animated.View>
        ) : (
          notifications.map((notif: any, i: number) => {
            const cfg  = TYPE_CONFIG[notif.type] ?? { icon: Bell, bg: Colors.muted, color: Colors.mutedFg }
            const Icon = cfg.icon
            return (
              <Animated.View key={notif.id} entering={FadeInLeft.delay(i * 40)}>
                <TouchableOpacity
                  style={[
                    styles.notifCard,
                    !notif.is_read && styles.notifCardUnread,
                  ]}
                  onPress={() => handleMarkRead(notif)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
                    <Icon size={18} color={cfg.color} />
                  </View>
                  <View style={styles.notifContent}>
                    <Text style={[styles.notifTitle, !notif.is_read && styles.notifTitleBold]}>
                      {notif.title}
                    </Text>
                    <Text style={styles.notifMsg} numberOfLines={2}>{notif.message}</Text>
                    {notif.created_date ? (
                      <Text style={styles.notifTime}>
                        {format(new Date(notif.created_date), 'd MMM, HH:mm', { locale: ru })}
                      </Text>
                    ) : null}
                  </View>
                  {!notif.is_read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              </Animated.View>
            )
          })
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingBottom: 100, gap: Spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },

  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: Spacing.sm },
  pageTitle: { fontSize: FontSize.xxxl, fontWeight: '700', color: Colors.foreground },
  subtitle: { fontSize: FontSize.md, color: Colors.mutedFg, marginTop: 4 },
  readAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    marginTop: 8,
  },
  readAllText: { fontSize: FontSize.sm, color: Colors.mutedFg },

  list: { gap: Spacing.sm },
  empty: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.mutedFg },

  notifCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    padding: Spacing.lg, borderRadius: Radius.lg,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  notifCardUnread: {
    backgroundColor: Colors.violetLight, borderColor: '#c4b5fd',
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: FontSize.md, color: Colors.foreground },
  notifTitleBold: { fontWeight: '600' },
  notifMsg: { fontSize: FontSize.sm, color: Colors.mutedFg, marginTop: 2 },
  notifTime: { fontSize: FontSize.xs, color: Colors.mutedFg, marginTop: 4 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary, marginTop: 4,
  },
})
