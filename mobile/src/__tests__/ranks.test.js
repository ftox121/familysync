import { RANKS, RANK_ANALYTICS_MIN_XP, getRankByXP } from '../ranks/ranks'

describe('RANKS', () => {
  test('has exactly 5 ranks', () => {
    expect(RANKS).toHaveLength(5)
  })

  test('rank keys in correct order', () => {
    const keys = RANKS.map(r => r.key)
    expect(keys).toEqual(['novice', 'responsible', 'pencil', 'pillar', 'legend'])
  })

  test('first rank starts at 0 xp', () => {
    expect(RANKS[0].xpMin).toBe(0)
  })

  test('Легенда семьи requires 4500 xp', () => {
    const legend = RANKS.find(r => r.key === 'legend')
    expect(legend.xpMin).toBe(4500)
  })

  test('each rank has a non-empty perks array', () => {
    for (const rank of RANKS) {
      expect(Array.isArray(rank.perks)).toBe(true)
      expect(rank.perks.length).toBeGreaterThan(0)
    }
  })

  test('xpBonusPct increases with rank', () => {
    for (let i = 1; i < RANKS.length; i++) {
      expect(RANKS[i].xpBonusPct).toBeGreaterThan(RANKS[i - 1].xpBonusPct)
    }
  })

  test('Новичок has 0% xp bonus', () => {
    const novice = RANKS.find(r => r.key === 'novice')
    expect(novice.xpBonusPct).toBe(0)
  })

  test('Легенда семьи has 50% xp bonus', () => {
    const legend = RANKS.find(r => r.key === 'legend')
    expect(legend.xpBonusPct).toBe(50)
  })

  test('each rank has an emoji', () => {
    for (const rank of RANKS) {
      expect(typeof rank.emoji).toBe('string')
      expect(rank.emoji.length).toBeGreaterThan(0)
    }
  })

  test('legend has no locked features', () => {
    const legend = RANKS.find(r => r.key === 'legend')
    expect(legend.locked).toHaveLength(0)
  })
})

describe('RANK_ANALYTICS_MIN_XP', () => {
  test('analytics unlocks at 800 xp (Семейный карандаш)', () => {
    expect(RANK_ANALYTICS_MIN_XP).toBe(800)
  })

  test('799 xp cannot access analytics', () => {
    expect(799).toBeLessThan(RANK_ANALYTICS_MIN_XP)
  })

  test('800 xp can access analytics', () => {
    expect(800).toBeGreaterThanOrEqual(RANK_ANALYTICS_MIN_XP)
  })
})

describe('getRankByXP', () => {
  test('returns novice for 0 xp', () => {
    expect(getRankByXP(0).key).toBe('novice')
  })

  test('returns novice for 249 xp', () => {
    expect(getRankByXP(249).key).toBe('novice')
  })

  test('returns responsible for 250 xp', () => {
    expect(getRankByXP(250).key).toBe('responsible')
  })

  test('returns pencil for 800 xp', () => {
    expect(getRankByXP(800).key).toBe('pencil')
  })

  test('returns pillar for 2000 xp', () => {
    expect(getRankByXP(2000).key).toBe('pillar')
  })

  test('returns legend for 4500+ xp', () => {
    expect(getRankByXP(4500).key).toBe('legend')
    expect(getRankByXP(10000).key).toBe('legend')
  })

  test('returns novice for negative xp', () => {
    expect(getRankByXP(-5).key).toBe('novice')
  })
})
