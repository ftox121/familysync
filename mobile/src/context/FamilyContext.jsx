import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/apiClient'

const FamilyContext = createContext(null)

export function FamilyProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userTick, setUserTick] = useState(0)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [bootError, setBootError] = useState('')
  const queryClient = useQueryClient()

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
    return () => {
      mounted = false
    }
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
