import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, WS_URL } from '../api/apiClient'
import { wsClient } from '../api/wsClient'

const FamilyContext = createContext(null)

export function FamilyProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userTick, setUserTick] = useState(0)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [bootError, setBootError] = useState('')
  const queryClient = useQueryClient()

  // Auth bootstrap
  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (mounted) {
        setIsBootstrapping(true)
        setBootError('')
      }
      try {
        await apiClient.ensureSession()
        const me = await apiClient.me()
        if (mounted) setUser(me)
      } catch (error) {
        if (mounted) {
          setUser(null)
          setBootError(error?.message || 'Не удалось подключиться к серверу')
        }
      } finally {
        if (mounted) setIsBootstrapping(false)
      }
    })()
    return () => { mounted = false }
  }, [userTick])

  const reloadUser = useCallback(() => setUserTick(t => t + 1), [])

  const { data: families = [], isLoading: isLoadingFamilies } = useQuery({
    queryKey: ['families', user?.email],
    queryFn: () => apiClient.getFamilies(),
    enabled: !!user?.email,
  })
  const family = families[0]

  const { data: members = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ['family-members', family?.id],
    queryFn: () => apiClient.getFamilyMembers(family.id),
    enabled: !!family?.id,
  })

  const currentMembership = members.find(m => m.user_email === user?.email)

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks', family?.id],
    queryFn: () => apiClient.getTasks(family.id),
    enabled: !!family?.id,
  })

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => apiClient.getNotifications(),
    enabled: !!user?.email,
  })

  // Family chat messages — used for unread badge in tab bar
  const { data: familyMessages = [] } = useQuery({
    queryKey: ['family-chat', family?.id],
    queryFn: () => apiClient.getFamilyMessages(family.id),
    enabled: !!family?.id,
  })

  const seenChatIdRef = useRef(null)

  // On first load, mark all existing messages as seen (no badge on app start)
  useEffect(() => {
    if (seenChatIdRef.current === null && familyMessages.length > 0) {
      seenChatIdRef.current = Math.max(...familyMessages.map(m => m.id))
    }
  }, [familyMessages])

  const unreadChatCount = seenChatIdRef.current === null ? 0 :
    familyMessages.filter(m => m.id > seenChatIdRef.current && m.user_email !== user?.email).length

  const markChatRead = useCallback(() => {
    if (familyMessages.length > 0) {
      seenChatIdRef.current = Math.max(...familyMessages.map(m => m.id))
    }
  }, [familyMessages])

  // WebSocket: connect once we have a family + token, reconnect if family changes
  useEffect(() => {
    if (!family?.id || !user?.email) return

    let removed = false
    apiClient.getToken().then(token => {
      if (!token || removed) return
      wsClient.connect(WS_URL, token, family.id)

      const unsubscribe = wsClient.addListener(event => {
        switch (event.type) {
          case 'tasks_updated':
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            break
          case 'members_updated':
            queryClient.invalidateQueries({ queryKey: ['family-members'] })
            queryClient.invalidateQueries({ queryKey: ['families'] })
            break
          case 'family_chat':
            queryClient.invalidateQueries({ queryKey: ['family-chat'] })
            break
          case 'task_chat':
            queryClient.invalidateQueries({ queryKey: ['task-messages', event.taskId] })
            break
          case 'notifications_updated':
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            break
          case 'reward_claims_updated':
            queryClient.invalidateQueries({ queryKey: ['reward-claims'] })
            queryClient.invalidateQueries({ queryKey: ['family-members'] })
            break
          default:
            break
        }
      })

      return unsubscribe
    }).catch(() => {})

    return () => {
      removed = true
      wsClient.disconnect()
    }
  }, [family?.id, user?.email, queryClient])

  const isParent =
    currentMembership?.role === 'parent' || currentMembership?.role === 'grandparent'
  const isChild = currentMembership?.role === 'child'

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['family-members'] })
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
    queryClient.invalidateQueries({ queryKey: ['families'] })
    queryClient.invalidateQueries({ queryKey: ['rewards'] })
    queryClient.invalidateQueries({ queryKey: ['reward-claims'] })
  }, [queryClient])

  const isLoading =
    isBootstrapping || (!!user && (isLoadingFamilies || isLoadingMembers || isLoadingTasks))

  return (
    <FamilyContext.Provider
      value={{
        user,
        family,
        currentMembership,
        members,
        tasks,
        notifications,
        isParent,
        isChild,
        isLoading,
        bootError,
        hasFamily: !!currentMembership,
        refresh,
        reloadUser,
        unreadChatCount,
        markChatRead,
      }}
    >
      {children}
    </FamilyContext.Provider>
  )
}

export function useFamilyContext() {
  const ctx = useContext(FamilyContext)
  if (!ctx) throw new Error('useFamilyContext must be used within FamilyProvider')
  return ctx
}
