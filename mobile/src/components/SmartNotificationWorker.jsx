import { useEffect, useRef } from 'react'
import { apiClient } from '../api/apiClient'
import { createSmartNotificationScheduler } from '../domain/notifications/SmartNotificationPlanner'
import { useFamilyContext } from '../context/FamilyContext'

export default function SmartNotificationWorker() {
  const { tasks, members, currentMembership, hasFamily } = useFamilyContext()
  const tasksRef = useRef(tasks)
  const membersRef = useRef(members)
  const familyRef = useRef(currentMembership)

  tasksRef.current = tasks
  membersRef.current = members
  familyRef.current = currentMembership

  useEffect(() => {
    if (!hasFamily || !currentMembership?.family_id) return

    const sched = createSmartNotificationScheduler({
      getTasks: () => tasksRef.current ?? [],
      intervalMs: 90_000,
      config: { reminderHoursBefore: 2, overdueRepeatHours: 12 },
      onDispatch: async batch => {
        const fam = familyRef.current
        const mems = membersRef.current ?? []
        if (!fam?.family_id) return
        const adults = mems.filter(m => ['parent', 'grandparent', 'other'].includes(m.role))
        for (const n of batch) {
          const target = n.assigneeEmail ?? adults[0]?.user_email
          if (!target) continue
          await apiClient.createNotification({
            family_id: fam.family_id,
            user_email: target,
            title: n.title,
            message: n.message,
            type: 'reminder',
          })
        }
      },
    })
    sched.start()
    return () => sched.stop()
  }, [hasFamily, currentMembership?.family_id])

  return null
}
