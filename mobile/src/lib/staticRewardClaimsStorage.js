import AsyncStorage from '@react-native-async-storage/async-storage'

const key = (familyId, userEmail) => `familysync_static_reward_claims_${familyId}_${userEmail}`

export async function getStaticRewardClaims(familyId, userEmail) {
  if (!familyId || !userEmail) return []

  try {
    const raw = await AsyncStorage.getItem(key(familyId, userEmail))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function addStaticRewardClaim(familyId, userEmail, reward) {
  if (!familyId || !userEmail || !reward) return null

  const current = await getStaticRewardClaims(familyId, userEmail)
  const claim = {
    id: `static-${reward.id}-${Date.now()}`,
    reward_id: reward.id,
    user_email: userEmail,
    status: 'approved',
    approved_at: new Date().toISOString(),
    claimed_at: new Date().toISOString(),
    title: reward.title,
    icon: reward.icon,
    type: reward.type,
    rarity: reward.rarity,
    points_cost: reward.points_cost,
    _source: 'static_local',
  }

  try {
    await AsyncStorage.setItem(key(familyId, userEmail), JSON.stringify([claim, ...current]))
    return claim
  } catch {
    return null
  }
}
