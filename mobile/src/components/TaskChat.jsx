import { useState } from 'react'
import { MessageCircle } from 'lucide-react-native'
import {
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/apiClient'
import ChatConversation from './ChatConversation'
import { useFamilyContext } from '../context/FamilyContext'
import { colors, radius, spacing } from '../theme'

export default function TaskChat({ taskId, fullScreen = false }) {
  const { user, members } = useFamilyContext()
  const [message, setMessage] = useState('')
  const queryClient = useQueryClient()

  const { data: messages = [] } = useQuery({
    queryKey: ['task-messages', taskId],
    queryFn: () => apiClient.getTaskMessages(taskId),
    enabled: !!taskId,
    staleTime: 0,
  })

  const sendMutation = useMutation({
    mutationFn: msg => apiClient.sendTaskMessage(taskId, msg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-messages', taskId] })
      setMessage('')
    },
  })

  const handleSend = (quickMessage) => {
    const text = typeof quickMessage === 'string' ? quickMessage.trim() : message.trim()
    if (!text) return
    sendMutation.mutate(text)
  }

  const getMemberMeta = (email) => {
    const member = members.find(m => m.user_email === email)
    const displayName = member?.display_name || email
    return {
      displayName,
      shortName: displayName.slice(0, 2).toUpperCase(),
      avatarColor: member?.avatar_color || 'violet',
    }
  }

  return (
    <View style={fullScreen ? styles.flex : undefined}>
      <View style={[styles.container, fullScreen && styles.fullScreenContainer]}>
        {!fullScreen ? (
          <View style={styles.header}>
            <MessageCircle size={18} color={colors.primary} />
            <Text style={styles.headerText}>Обсуждение задачи</Text>
          </View>
        ) : null}

        <ChatConversation
          messages={messages}
          message={message}
          onChangeMessage={setMessage}
          onSend={handleSend}
          placeholder="Написать сообщение..."
          currentUserEmail={user?.email}
          getMemberMeta={getMemberMeta}
          isSending={sendMutation.isLoading}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 74 : 0}
          bottomPadding={fullScreen ? 18 : 14}
          listStyle={[styles.messagesScroll, fullScreen && styles.fullScreenMessages]}
          emptyTitle="Обсуждение еще не началось"
          emptyText="Напишите первое сообщение по этой задаче."
        />
      </View>
    </View>
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
})
