import { useCallback, useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react-native'
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/apiClient'
import ChatConversation from '../components/ChatConversation'
import ScreenBackground from '../components/ScreenBackground'
import { useFamilyContext } from '../context/FamilyContext'
import { useTabBar } from '../context/TabBarContext'
import { colors, spacing, typography } from '../theme'

export default function FamilyChatScreen() {
  const { family, members, user, isLoading: familyLoading } = useFamilyContext()
  const insets = useSafeAreaInsets()
  const { handleScroll, show, hide } = useTabBar()
  const [message, setMessage] = useState('')
  const [kbHeight, setKbHeight] = useState(0)
  const queryClient = useQueryClient()

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['family-chat', family?.id],
    queryFn: () => apiClient.getFamilyMessages(family.id),
    enabled: !!family?.id,
  })

  const sendMutation = useMutation({
    mutationFn: msg => apiClient.sendFamilyMessage(family.id, msg),
    onSuccess: () => {
      setMessage('')
      queryClient.invalidateQueries({ queryKey: ['family-chat', family?.id] })
    },
  })

  useEffect(() => {
    show()
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => { hide(); setKbHeight(e.endCoordinates.height) }
    )
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => { show(); setKbHeight(0) }
    )
    return () => { showSub.remove(); hideSub.remove() }
  }, [hide, show])

  const getMemberMeta = useCallback(email => {
    const member = members.find(m => m.user_email === email)
    const displayName = member?.display_name || email
    return {
      displayName,
      shortName: displayName.slice(0, 2).toUpperCase(),
      avatarColor: member?.avatar_color || 'violet',
    }
  }, [members])

  const onlineMembers = members
    .filter(member => member.user_email)
    .slice(0, 6)
    .map(member => ({
      key: String(member.id),
      shortName: (member.display_name || '?').slice(0, 2).toUpperCase(),
      avatarColor: member.avatar_color || 'violet',
    }))

  const handleSend = (quickMessage) => {
    const text = typeof quickMessage === 'string' ? quickMessage.trim() : message.trim()
    if (!text) return
    sendMutation.mutate(text)
  }

  if (familyLoading || isLoading)
    return (
      <ScreenBackground>
        <View style={[styles.center, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenBackground>
    )

  return (
    <ScreenBackground>
      <View style={[styles.flex, kbHeight > 0 && { paddingBottom: kbHeight }]}>
        <View style={[styles.container, { paddingTop: insets.top + 10 }]}> 
          <View style={styles.header}>
            <Text style={typography.caption}>Семейное общение</Text>
            <View style={styles.headerRow}>
              <MessageCircle size={20} color={colors.primary} />
              <Text style={styles.title}>Общий чат семьи</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <ChatConversation
            messages={messages}
            message={message}
            onChangeMessage={setMessage}
            onSend={handleSend}
            placeholder="Написать в общий чат..."
            currentUserEmail={user?.email}
            getMemberMeta={getMemberMeta}
            isSending={sendMutation.isLoading}
            bottomPadding={kbHeight > 0 ? Math.max(insets.bottom, 12) : Math.max(insets.bottom, 14) + 100}
            onlineMembers={onlineMembers}
            onScroll={handleScroll}
            emptyTitle="Семейный диалог еще не начался"
            emptyText="Напишите первое сообщение в общий чат."
          />
        </View>
      </View>
    </ScreenBackground>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, paddingHorizontal: spacing.screen },
  header: { marginBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  divider: { height: 1, backgroundColor: '#EDE9FE', marginBottom: 10 },
})
