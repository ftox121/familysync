import { useMemo } from 'react'
import { recommendAssignee } from '../domain/smartAssignment/SmartAssignmentService'

/**
 * ViewModel-хук: умное назначение (данные из контекста семьи).
 */
export function useSmartAssignRecommendation(members, tasks) {
  return useMemo(() => recommendAssignee(members ?? [], tasks ?? []), [members, tasks])
}
