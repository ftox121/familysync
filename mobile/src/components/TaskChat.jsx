import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send } from 'lucide-react-native'
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/apiClient'
import { useFamilyContext } from '../context/FamilyContext'
import { colors, radius, spacing } from '../theme'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { parseDate } from '../lib/utils'

export default function TaskChat({ taskId, fullScreen = false }) {
  const { user, members } = useFamilyContext()
  const [message, setMessage] = useState('')
  const queryClient = useQueryClient()
  const scrollRef = useRef(null)

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['task-messages', taskId],
    queryFn: () => apiClient.getTaskMessages(taskId),
    enabled: !!taskId,
    refetchInterval: 5000, // Обновлять каждые 5 секунд
  })

  const sendMutation = useMutation({
    mutationFn: msg => apiClient.sendTaskMessage(taskId, msg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-messages', taskId] })
      setMessage('')
    },
  })

  const handleSend = () => {
    if (!message.trim()) return
    sendMutation.mutate(message.trim())
  }

  useEffect(() => {
    if (messages.length > 0) {
      scrollRef.current?.scrollToEnd({ animated: true })
    }
  }, [messages.length])

  const getMemberName = (email) => {
    const member = members.find(m => m.user_email === email)
    return member?.display_name || email
  }

  return (
    <KeyboardAvoidingView
      style={fullScreen ? styles.flex : undefined}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 74 : 0}
    >
      <View style={[styles.container, fullScreen && styles.fullScreenContainer]}>
        {!fullScreen ? (
          <View style={styles.header}>
            <MessageCircle size={18} color={colors.primary} />
            <Text style={styles.headerText}>Обсуждение задачи</Text>
          </View>
        ) : null}

        <ScrollView
          ref={scrollRef}
          style={[styles.messagesScroll, fullScreen && styles.fullScreenMessages]}
          contentContainerStyle={styles.messagesList}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <View style={[styles.emptyWrap, fullScreen && styles.emptyWrapFull]}>
              <View style={styles.emptyIcon}>
                <MessageCircle size={18} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Обсуждение еще не началось</Text>
              <Text style={styles.emptyText}>Напишите первое сообщение по этой задаче.</Text>
            </View>
          ) : (
            messages.map(item => {
              const isMe = item.user_email === user?.email
              return (
                <View key={item.id} style={[styles.messageRow, isMe ? styles.messageRowMine : styles.messageRowOther]}>
                  <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.otherMessage]}>
                  {!isMe ? <Text style={styles.senderName}>{getMemberName(item.user_email)}</Text> : null}
                  <Text style={[styles.messageText, isMe && styles.myMessageText]}>{item.message}</Text>
                  <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
                    {format(parseDate(item.created_at || item.created_date), 'HH:mm', { locale: ru })}
                  </Text>
                  </View>
                </View>
              )
            })
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Написать сообщение..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            returnKeyType="default"
            blurOnSubmit={false}
            textAlignVertical="top"
          />
          <Pressable
            style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!message.trim() || sendMutation.isLoading}
          >
            <Send size={20} color={message.trim() ? '#fff' : colors.textMuted} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.outline,
    marginTop: 16,
    overflow: 'hidden',
  },
  fullScreenContainer: {
    flex: 1,
    marginTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  headerText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  messagesScroll: {
    maxHeight: 320,
  },
  fullScreenMessages: {
    flex: 1,
    maxHeight: undefined,
  },
  messagesList: {
    padding: 16,
    gap: 12,
    minHeight: 200,
  },
  messageRow: {
    width: '100%',
    flexDirection: 'row',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myMessage: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 8,
  },
  otherMessage: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
    borderBottomLeftRadius: 8,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  emptyWrapFull: {
    flex: 1,
    minHeight: 320,
  },
  emptyIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
    backgroundColor: colors.surfaceStrong,
  },
  input: {
    flex: 1,
    backgroundColor: colors.muted,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.muted,
  },
})
