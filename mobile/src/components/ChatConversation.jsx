import { useEffect, useMemo, useRef } from 'react'
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { format, isSameDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import { AVATAR_PALETTE, parseDate } from '../lib/utils'

const QUICK_REACTIONS = ['❤️', '😂', '👍', '🔥', '😮', '🎉']

function ChatAvatar({ label, color = 'violet', size = 34, online = false }) {
  const pal = AVATAR_PALETTE[color] ?? AVATAR_PALETTE.violet

  return (
    <View style={{ position: 'relative' }}>
      <View style={[styles.avatarOrb, {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: pal.text,
      }]}>
        <Text style={[styles.avatarInitials, { fontSize: size * 0.34 }]}>{label}</Text>
      </View>
      {online ? (
        <View style={[styles.onlineDot, { width: 9, height: 9, borderRadius: 5 }]} />
      ) : null}
    </View>
  )
}

function DateDivider({ label }) {
  return (
    <View style={styles.dateDivider}>
      <View style={styles.dateLine} />
      <Text style={styles.dateText}>{label}</Text>
      <View style={styles.dateLine} />
    </View>
  )
}

function MessageBubble({ msg, showAvatar }) {
  const isMe = msg.isMe
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      tension: 100,
      friction: 12,
      useNativeDriver: true,
    }).start()
  }, [anim])

  return (
    <Animated.View
      style={[
        styles.msgRow,
        isMe ? styles.msgRowMe : styles.msgRowOther,
        { opacity: anim, transform: [{ scale: anim }] },
      ]}
    >
      {!isMe ? (showAvatar ? <ChatAvatar label={msg.avatarLabel} color={msg.avatarColor} /> : <View style={styles.avatarSpacer} />) : null}

      <View style={{ maxWidth: '72%' }}>
        {!isMe && showAvatar ? <Text style={styles.senderName}>{msg.senderName}</Text> : null}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>{msg.text}</Text>
        </View>
        <Text style={[styles.messageTime, isMe ? styles.messageTimeMe : styles.messageTimeOther]}>{msg.time}</Text>
      </View>

      {isMe ? (showAvatar ? <ChatAvatar label={msg.avatarLabel} color={msg.avatarColor} /> : <View style={styles.avatarSpacer} />) : null}
    </Animated.View>
  )
}

export default function ChatConversation({
  messages,
  message,
  onChangeMessage,
  onSend,
  placeholder,
  currentUserEmail,
  getMemberMeta,
  isSending = false,
  reactions = QUICK_REACTIONS,
  bottomPadding = 16,
  keyboardVerticalOffset = 0,
  onlineMembers = [],
  onScroll,
  listStyle,
  emptyTitle,
  emptyText,
}) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (messages.length > 0) {
      const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60)
      return () => clearTimeout(t)
    }
  }, [messages.length])

  const viewItems = useMemo(() => {
    const items = []

    messages.forEach((item, index) => {
      const createdAt = parseDate(item.created_at || item.created_date)
      const prev = messages[index - 1]
      const prevDate = prev ? parseDate(prev.created_at || prev.created_date) : null
      const meta = getMemberMeta(item.user_email)

      if (!prevDate || !isSameDay(createdAt, prevDate)) {
        items.push({
          id: `date-${item.id}`,
          type: 'date',
          label: format(createdAt, 'd MMMM', { locale: ru }),
        })
      }

      items.push({
        id: String(item.id),
        type: 'message',
        isMe: item.user_email === currentUserEmail,
        senderName: meta.displayName,
        avatarLabel: meta.shortName,
        avatarColor: meta.avatarColor,
        text: item.message,
        time: format(createdAt, 'HH:mm', { locale: ru }),
        showAvatar: !prev || prev.user_email !== item.user_email,
      })
    })

    return items
  }, [currentUserEmail, getMemberMeta, messages])

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {onlineMembers.length > 0 ? (
        <View style={styles.onlineRow}>
          {onlineMembers.map(member => (
            <View key={member.key} style={{ marginRight: 6 }}>
              <ChatAvatar label={member.shortName} color={member.avatarColor} size={26} online />
            </View>
          ))}
          <Text style={styles.onlineCount}>{onlineMembers.length} онлайн</Text>
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        style={[styles.messages, listStyle]}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScroll={onScroll}
        scrollEventThrottle={16}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {viewItems.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        ) : (
          viewItems.map(item => (
            item.type === 'date'
              ? <DateDivider key={item.id} label={item.label} />
              : <MessageBubble key={item.id} msg={item} showAvatar={item.showAvatar} />
          ))
        )}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reactionsScroll} contentContainerStyle={styles.reactions}>
        {reactions.map(em => (
          <TouchableOpacity key={em} onPress={() => onSend(em)} style={styles.reactionBtn}>
            <Text style={{ fontSize: 20 }}>{em}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={[styles.inputRow, { paddingBottom: bottomPadding }]}> 
        <View style={styles.inputWrap}>
          <TextInput
            value={message}
            onChangeText={onChangeMessage}
            onSubmitEditing={() => onSend()}
            placeholder={placeholder}
            placeholderTextColor="#C4B5FD"
            style={styles.input}
            returnKeyType="send"
            multiline
            maxLength={800}
            blurOnSubmit={false}
          />
        </View>
        <TouchableOpacity
          onPress={() => onSend()}
          disabled={!message.trim() || isSending}
          style={[styles.sendBtn, { backgroundColor: message.trim() ? '#7C3AED' : '#EDE9FE' }]}
        >
          <Text style={{ fontSize: 18, color: message.trim() ? '#fff' : '#A78BFA' }}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  avatarOrb: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarInitials: { color: '#fff', fontWeight: '800' },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#34D399',
    borderWidth: 2,
    borderColor: '#F5F0FF',
  },
  onlineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  onlineCount: { fontWeight: '600', fontSize: 11, color: '#9CA3AF', marginLeft: 4 },
  messages: { flex: 1 },
  messagesContent: { gap: 8, paddingBottom: 8 },
  dateDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 6 },
  dateLine: { flex: 1, height: 1, backgroundColor: '#EDE9FE' },
  dateText: { fontWeight: '700', fontSize: 11, color: '#C4B5FD' },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },
  avatarSpacer: { width: 34 },
  senderName: { fontWeight: '700', fontSize: 11, color: '#9CA3AF', marginBottom: 3, marginLeft: 4 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: {
    backgroundColor: '#7C3AED',
    borderBottomRightRadius: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  bubbleOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  messageText: { fontWeight: '600', fontSize: 15, lineHeight: 22 },
  messageTextMe: { color: '#fff' },
  messageTextOther: { color: '#1E1B4B' },
  messageTime: { fontWeight: '600', fontSize: 10, color: '#C4B5FD', marginTop: 3, paddingHorizontal: 4 },
  messageTimeMe: { textAlign: 'right' },
  messageTimeOther: { textAlign: 'left' },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyTitle: { fontWeight: '800', fontSize: 15, color: '#1E1B4B' },
  emptyText: { marginTop: 6, fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 19 },
  reactionsScroll: { maxHeight: 52 },
  reactions: { paddingVertical: 6, gap: 8, alignItems: 'center' },
  reactionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: { flexDirection: 'row', gap: 10, paddingTop: 12, alignItems: 'center' },
  inputWrap: {
    flex: 1,
    minHeight: 46,
    backgroundColor: '#fff',
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  input: { fontWeight: '600', fontSize: 14, color: '#1E1B4B', maxHeight: 110 },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
})
