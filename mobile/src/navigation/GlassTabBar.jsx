import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Gift,
  ListTodo,
  MessageCircle,
  Plus,
  User,
} from 'lucide-react-native'
import { colors, gradients, radius, shadows, typography } from '../theme'

const ICONS = {
  Tasks: ListTodo,
  Chat: MessageCircle,
  Rewards: Gift,
  AddTask: Plus,
  Profile: User,
}

const LABELS = {
  Tasks: 'Задачи',
  Chat: 'Чат',
  Rewards: 'Награды',
  AddTask: 'Добавить',
  Profile: 'Профиль',
}

const ORDER = ['Tasks', 'Chat', 'AddTask', 'Rewards', 'Profile']

export default function GlassTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets()
  const bottomPad = Math.max(insets.bottom, 14)

  return (
    <View style={[styles.outer, { paddingBottom: bottomPad }]}> 
      <View style={styles.pillWrap}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={55} tint="light" style={styles.blur}>
            <TabRow state={state} navigation={navigation} />
          </BlurView>
        ) : (
          <View style={styles.androidBar}>
            <TabRow state={state} navigation={navigation} />
          </View>
        )}
      </View>
    </View>
  )
}

function TabRow({ state, navigation }) {
  return (
    <View style={styles.row}>
      {ORDER.map(name => {
        const route = state.routes.find(r => r.name === name)
        if (!route) return null
        const index = state.routes.findIndex(r => r.name === name)
        const isFocused = state.index === index

        if (name === 'AddTask') {
          return (
            <View key={name} style={styles.fabSlot}>
              <Pressable
                onPress={() => navigation.navigate('AddTask')}
                style={({ pressed }) => [styles.fabOuter, pressed && styles.fabPressed]}
              >
                <LinearGradient
                  colors={gradients.tabFab}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.fab}
                >
                  <Plus size={26} color="#fff" strokeWidth={2.5} />
                </LinearGradient>
              </Pressable>
              <Text style={[typography.tabLabel, styles.fabLabel, { color: colors.primary }]}>
                {LABELS.AddTask}
              </Text>
            </View>
          )
        }

        const Icon = ICONS[name]
        const color = isFocused ? colors.primary : colors.tabInactive
        return (
          <Pressable
            key={name}
            accessibilityRole="button"
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              })
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name)
            }}
            style={({ pressed }) => [styles.tabItem, pressed && { opacity: 0.85 }]}
          >
            <View>
              <Icon size={22} color={color} strokeWidth={isFocused ? 2.4 : 2} />
            </View>
            <Text
              style={[
                typography.tabLabel,
                { color, marginTop: 4 },
                isFocused && { color: colors.primary },
              ]}
            >
              {LABELS[name]}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  pillWrap: {
    marginHorizontal: 12,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.tabBar,
    maxWidth: 440,
    width: '92%',
  },
  blur: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  androidBar: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.outline,
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 68,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    minWidth: 56,
    paddingVertical: 6,
  },
  fabSlot: {
    alignItems: 'center',
    marginTop: 0,
    width: 76,
  },
  fabOuter: {
    ...shadows.fab,
  },
  fabPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.9,
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  fabLabel: {
    marginTop: 5,
    textAlign: 'center',
    fontWeight: '700',
  },
  iconBadgeWrap: { position: 'relative' },
  notifDot: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.priorityHigh,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
})
