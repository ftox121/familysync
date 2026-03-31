import { useMemo } from 'react'
import { buildFamilyAnalyticsSnapshot } from '../domain/analytics/FamilyAnalyticsService'

export function useFamilyAnalyticsViewModel(members, tasks) {
  return useMemo(
    () => buildFamilyAnalyticsSnapshot(members ?? [], tasks ?? []),
    [members, tasks]
  )
}
