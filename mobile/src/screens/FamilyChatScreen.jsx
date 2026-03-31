import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send } from 'lucide-react-native'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { apiClient } from '../api/apiClient'
import ScreenBackground from '../components/ScreenBackground'
import { useFamilyContext } from '../context/FamilyContext'
import { colors, radius, spacing, typography } from '../theme'

export default function FamilyChatScreen() {
  const { family, members, user, isLoading: familyLoading } = useFamilyContext()
  const insets = useSafeAreaInsets()
  const [message, setMessage] = useState('')
  const listRef = useRef(null)
  const queryClient = useQueryClient()

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['family-chat', family?.id],
    queryFn: () => apiClient.getFamilyMessages(family.id),
    enabled: !!family?.id,
    refetchInterval: 3500,
  })

  const sendMutation = useMutation({
    mutationFn: msg => apiClient.sendFamilyMessage(family.id, msg),
    onSuccess: () => {
      setMessage('')
      queryClient.invalidateQueries({ queryKey: ['family-chat', family?.id] })
    },
  })

  useEffect(() => {
    if (messages.length) listRef.current?.scrollToEnd({ animated: true })
  }, [messages.length])

  const getName = email => members.find(m => m.user_email === email)?.display_name || email

  const handleSend = () => {
    const text = message.trim()
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 78 : 0}
      >
        <View style={[styles.container, { paddingTop: insets.top + 10 }]}> 
          <View style={styles.header}>
            <Text style={typography.caption}>Семейное общение</Text>
            <View style={styles.headerRow}>
              <MessageCircle size={20} color={colors.primary} />
              <Text style={styles.title}>Общий чат семьи</Text>
            </View>
          </View>

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={item => String(item.id)}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const mine = item.user_email === user?.email
              return (
                <View style={[styles.msgWrap, mine ? styles.mineWrap : styles.otherWrap]}>
                  {!mine ? <Text style={styles.sender}>{getName(item.user_email)}</Text> : null}
                  <Text style={[styles.msgText, mine && styles.mineText]}>{item.message}</Text>
                  <Text style={[styles.time, mine && styles.mineTime]}>
                    {format(new Date(item.created_at), 'HH:mm', { locale: ru })}
                  </Text>
                </View>
              )
            }}
            ListEmptyComponent={<Text style={styles.empty}>Начните семейный диалог 👋</Text>}
          />

          <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 14) + 110 }]}> 
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Написать в общий чат..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={800}
              blurOnSubmit={false}
            />
            <Pressable
              style={[styles.send, !message.trim() && styles.sendDisabled]}
              onPress={handleSend}
              disabled={!message.trim() || sendMutation.isLoading}
            >
              <Send size={18} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  list: { flex: 1 },
  listContent: { paddingVertical: 6, gap: 10 },
  msgWrap: {
    maxWidth: '82%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  mineWrap: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  otherWrap: { alignSelf: 'flex-start', backgroundColor: colors.surfaceStrong, borderWidth: 1, borderColor: colors.outline },
  sender: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 3 },
  msgText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  mineText: { color: '#fff' },
  time: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
  mineTime: { color: 'rgba(255,255,255,0.8)' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40, fontSize: 14 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingTop: 10, paddingBottom: 14 },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxHeight: 120,
    fontSize: 14,
    color: colors.text,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.5 },
})
