import AsyncStorage from '@react-native-async-storage/async-storage'

const key = (email) => `familysync_streak_${email}`

export async function getStreakData(userEmail) {
  try {
    const raw = await AsyncStorage.getItem(key(userEmail))
    if (!raw) return { streakCount: 0, onTimeStreak: 0, lastCompletedAt: null }
    return JSON.parse(raw)
  } catch {
    return { streakCount: 0, onTimeStreak: 0, lastCompletedAt: null }
  }
}

export async function saveStreakData(userEmail, data) {
  try {
    await AsyncStorage.setItem(key(userEmail), JSON.stringify(data))
  } catch {}
}
