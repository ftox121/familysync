import {
  getRankXpMultiplier,
  computeTaskRewardXp,
  getTierForXp,
  nextStreakCount,
  nextOnTimeStreak,
  wasTaskCompletedOnTime,
  evaluateNewAchievements,
  LEVEL_TIERS,
} from '../domain/gamification/GamificationService'

// ─── getRankXpMultiplier ───────────────────────────────────────────────────

describe('getRankXpMultiplier', () => {
  test('returns 1.0 for Новичок (0 xp)', () => {
    expect(getRankXpMultiplier(0)).toBe(1.0)
    expect(getRankXpMultiplier(249)).toBe(1.0)
  })
  test('returns 1.1 for Ответственный (250+)', () => {
    expect(getRankXpMultiplier(250)).toBe(1.1)
    expect(getRankXpMultiplier(799)).toBe(1.1)
  })
  test('returns 1.2 for Семейный карандаш (800+)', () => {
    expect(getRankXpMultiplier(800)).toBe(1.2)
    expect(getRankXpMultiplier(1999)).toBe(1.2)
  })
  test('returns 1.35 for Опора семьи (2000+)', () => {
    expect(getRankXpMultiplier(2000)).toBe(1.35)
    expect(getRankXpMultiplier(4499)).toBe(1.35)
  })
  test('returns 1.5 for Легенда семьи (4500+)', () => {
    expect(getRankXpMultiplier(4500)).toBe(1.5)
    expect(getRankXpMultiplier(99999)).toBe(1.5)
  })
})

// ─── computeTaskRewardXp ──────────────────────────────────────────────────

describe('computeTaskRewardXp', () => {
  const baseTask = { priority: 'medium' }

  test('base medium priority = 10 xp for Новичок', () => {
    const r = computeTaskRewardXp(baseTask, { memberXp: 0 })
    expect(r.base).toBe(10)
    expect(r.rankMultiplier).toBe(1.0)
    expect(r.total).toBe(10)
  })

  test('high priority base = 20', () => {
    const r = computeTaskRewardXp({ priority: 'high' }, { memberXp: 0 })
    expect(r.base).toBe(20)
  })

  test('low priority base = 5', () => {
    const r = computeTaskRewardXp({ priority: 'low' }, { memberXp: 0 })
    expect(r.base).toBe(5)
  })

  test('rank multiplier applied for Легенда (4500 xp)', () => {
    const r = computeTaskRewardXp({ priority: 'medium' }, { memberXp: 4500 })
    expect(r.rankMultiplier).toBe(1.5)
    expect(r.total).toBe(15) // 10 * 1.5
  })

  test('streak multiplier: 3 tasks in a row = +15%', () => {
    const r = computeTaskRewardXp({ priority: 'medium' }, { memberXp: 0, streakCount: 3 })
    // 10 * 1.15 = 11.5 → rounded to 12
    expect(r.streakMultiplier).toBeCloseTo(1.15)
    expect(r.total).toBe(12)
  })

  test('streak capped at 5 (max +25%)', () => {
    const r = computeTaskRewardXp({ priority: 'medium' }, { memberXp: 0, streakCount: 10 })
    expect(r.streakMultiplier).toBeCloseTo(1.25)
  })

  test('on-time bonus +5 xp', () => {
    const task = {
      priority: 'medium',
      due_date: '2026-04-25',
      completed_at: '2026-04-24T10:00:00Z',
    }
    const r = computeTaskRewardXp(task, { memberXp: 0 })
    expect(r.onTimeBonus).toBe(5)
    expect(r.total).toBe(15)
  })

  test('no on-time bonus when completed late', () => {
    const task = {
      priority: 'medium',
      due_date: '2026-04-20',
      completed_at: '2026-04-21T10:00:00Z',
    }
    const r = computeTaskRewardXp(task, { memberXp: 0 })
    expect(r.onTimeBonus).toBe(0)
  })

  test('custom points_reward overrides priority base', () => {
    const r = computeTaskRewardXp({ points_reward: 50 }, { memberXp: 0 })
    expect(r.base).toBe(50)
    expect(r.total).toBe(50)
  })
})

// ─── getTierForXp ─────────────────────────────────────────────────────────

describe('getTierForXp', () => {
  test('0 xp → Новичок tier', () => {
    const { tier, nextTier } = getTierForXp(0)
    expect(tier.id).toBe('novice')
    expect(nextTier.id).toBe('responsible')
  })

  test('249 xp still Новичок', () => {
    expect(getTierForXp(249).tier.id).toBe('novice')
  })

  test('250 xp → Ответственный', () => {
    expect(getTierForXp(250).tier.id).toBe('responsible')
  })

  test('800 xp → Семейный карандаш', () => {
    expect(getTierForXp(800).tier.id).toBe('pencil')
  })

  test('2000 xp → Опора семьи', () => {
    expect(getTierForXp(2000).tier.id).toBe('pillar')
  })

  test('4500 xp → Легенда семьи, no next tier', () => {
    const { tier, nextTier, progressPercent } = getTierForXp(4500)
    expect(tier.id).toBe('legend')
    expect(nextTier).toBeUndefined()
    expect(progressPercent).toBe(100)
  })

  test('progress percent is correct within a tier', () => {
    // pencil: 800–2000 (span 1200). At 1000: (200/1200)*100 ≈ 17%
    const { progressPercent } = getTierForXp(1000)
    expect(progressPercent).toBe(17)
  })

  test('xpToNext is correct', () => {
    const { xpToNext } = getTierForXp(300) // responsible tier, next at 800 → 500 left
    expect(xpToNext).toBe(500)
  })
})

// ─── LEVEL_TIERS thresholds ───────────────────────────────────────────────

describe('LEVEL_TIERS thresholds', () => {
  const ids = LEVEL_TIERS.map(t => t.id)
  test('has 5 tiers in correct order', () => {
    expect(ids).toEqual(['novice', 'responsible', 'pencil', 'pillar', 'legend'])
  })
  test('legend requires 4500 xp', () => {
    const legend = LEVEL_TIERS.find(t => t.id === 'legend')
    expect(legend.minXp).toBe(4500)
  })
})

// ─── nextStreakCount ──────────────────────────────────────────────────────

describe('nextStreakCount', () => {
  test('first task ever → streak 1', () => {
    expect(nextStreakCount(0, null)).toBe(1)
  })

  test('completed within 48h → increments', () => {
    const now = new Date('2026-04-22T12:00:00Z')
    const last = '2026-04-22T00:00:00Z' // 12h ago
    expect(nextStreakCount(3, last, now)).toBe(4)
  })

  test('completed after 48h → resets to 1', () => {
    const now = new Date('2026-04-22T12:00:00Z')
    const last = '2026-04-20T10:00:00Z' // >48h ago
    expect(nextStreakCount(5, last, now)).toBe(1)
  })

  test('exactly 48h → still increments', () => {
    const now = new Date('2026-04-22T12:00:00Z')
    const last = '2026-04-20T12:00:00Z' // exactly 48h
    expect(nextStreakCount(2, last, now)).toBe(3)
  })
})

// ─── nextOnTimeStreak ─────────────────────────────────────────────────────

describe('nextOnTimeStreak', () => {
  test('increments when on time', () => {
    expect(nextOnTimeStreak(4, true)).toBe(5)
  })
  test('resets to 0 when late', () => {
    expect(nextOnTimeStreak(7, false)).toBe(0)
  })
  test('starts at 1 from null when on time', () => {
    expect(nextOnTimeStreak(null, true)).toBe(1)
  })
})

// ─── wasTaskCompletedOnTime ───────────────────────────────────────────────

describe('wasTaskCompletedOnTime', () => {
  test('true when no due_date', () => {
    expect(wasTaskCompletedOnTime({ completed_at: '2026-04-22T10:00:00Z' })).toBe(true)
  })

  test('true when completed before due date (date string)', () => {
    expect(wasTaskCompletedOnTime({
      due_date: '2026-04-25',
      completed_at: '2026-04-22T10:00:00Z',
    })).toBe(true)
  })

  test('true when completed on due date (UTC end-of-day)', () => {
    // After fix #8: due_date without time becomes T23:59:59Z (UTC)
    expect(wasTaskCompletedOnTime({
      due_date: '2026-04-22',
      completed_at: '2026-04-22T23:59:00Z',
    })).toBe(true)
  })

  test('false when completed after due date', () => {
    expect(wasTaskCompletedOnTime({
      due_date: '2026-04-20',
      completed_at: '2026-04-22T10:00:00Z',
    })).toBe(false)
  })
})

// ─── evaluateNewAchievements ──────────────────────────────────────────────

describe('evaluateNewAchievements', () => {
  const baseMember = { tasks_completed: 0, points: 0, achievements_json: '[]' }

  test('first_task unlocked after 1 completion', () => {
    const member = { ...baseMember, tasks_completed: 1 }
    const unlocked = evaluateNewAchievements(member, { streakCount: 0, onTimeStreak: 0 })
    expect(unlocked.map(a => a.id)).toContain('first_task')
  })

  test('first_task not re-unlocked if already earned', () => {
    const member = { ...baseMember, tasks_completed: 1, achievements_json: '["first_task"]' }
    const unlocked = evaluateNewAchievements(member, { streakCount: 0, onTimeStreak: 0 })
    expect(unlocked.map(a => a.id)).not.toContain('first_task')
  })

  test('streak_3 unlocked at streakCount 3', () => {
    const member = { ...baseMember, tasks_completed: 5 }
    const unlocked = evaluateNewAchievements(member, { streakCount: 3, onTimeStreak: 0 })
    expect(unlocked.map(a => a.id)).toContain('streak_3')
  })

  test('fifty_tasks unlocked at 50 completions', () => {
    const member = { ...baseMember, tasks_completed: 50 }
    const unlocked = evaluateNewAchievements(member, { streakCount: 0, onTimeStreak: 0 })
    expect(unlocked.map(a => a.id)).toContain('fifty_tasks')
  })

  test('points_100 unlocked at 100 points', () => {
    const member = { ...baseMember, points: 100 }
    const unlocked = evaluateNewAchievements(member, { streakCount: 0, onTimeStreak: 0 })
    expect(unlocked.map(a => a.id)).toContain('points_100')
  })

  test('handles malformed achievements_json gracefully', () => {
    const member = { ...baseMember, achievements_json: 'not json' }
    expect(() => evaluateNewAchievements(member, { streakCount: 0, onTimeStreak: 0 })).not.toThrow()
  })
})
