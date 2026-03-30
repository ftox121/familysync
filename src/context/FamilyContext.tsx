import React, { createContext, useContext, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { base44 } from '../api/base44Client'

interface User {
  id: string
  email: string
  full_name: string
}

interface FamilyContextType {
  user: User | null
  family: any
  currentMembership: any
  members: any[]
  tasks: any[]
  notifications: any[]
  isParent: boolean
  isLoading: boolean
  hasFamily: boolean
  refresh: () => void
}

const FamilyContext = createContext<FamilyContextType | null>(null)

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    base44.auth.me().then(setUser)
  }, [])

  const { data: membership, isLoading: isLoadingMembership } = useQuery({
    queryKey: ['my-membership', user?.email],
    queryFn: () => base44.entities.FamilyMember.filter({ user_email: user!.email }),
    enabled: !!user?.email,
  })
  const currentMembership = membership?.[0]

  const { data: family, isLoading: isLoadingFamily } = useQuery({
    queryKey: ['family', currentMembership?.family_id],
    queryFn: async () => {
      const families = await base44.entities.Family.filter({ id: currentMembership.family_id })
      return families[0]
    },
    enabled: !!currentMembership?.family_id,
  })

  const { data: members = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ['family-members', currentMembership?.family_id],
    queryFn: () =>
      base44.entities.FamilyMember.filter({ family_id: currentMembership.family_id }),
    enabled: !!currentMembership?.family_id,
  })

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['tasks', currentMembership?.family_id],
    queryFn: () =>
      base44.entities.Task.filter(
        { family_id: currentMembership.family_id },
        '-created_date'
      ),
    enabled: !!currentMembership?.family_id,
  })

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () =>
      base44.entities.Notification.filter({ user_email: user!.email }, '-created_date', 50),
    enabled: !!user?.email,
  })

  const isParent =
    currentMembership?.role === 'parent' || currentMembership?.role === 'grandparent'

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['family-members'] })
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
    queryClient.invalidateQueries({ queryKey: ['my-membership'] })
    queryClient.invalidateQueries({ queryKey: ['family'] })
  }

  const isLoading =
    isLoadingMembership || isLoadingFamily || isLoadingMembers || isLoadingTasks

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
        isLoading,
        hasFamily: !!currentMembership,
        refresh,
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
