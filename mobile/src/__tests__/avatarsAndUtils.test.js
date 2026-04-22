import { ANIMAL_AVATARS, getAnimalAvatar } from '../lib/avatars'
import {
  AVATAR_COLORS,
  AVATAR_PALETTE,
  generateInviteCode,
  ROLE_LABELS,
} from '../lib/utils'

// ─── ANIMAL_AVATARS ───────────────────────────────────────────────────────

describe('ANIMAL_AVATARS', () => {
  test('default animals are unlocked at 0 xp', () => {
    const free = ANIMAL_AVATARS.filter(a => a.minXp === 0)
    expect(free.length).toBeGreaterThanOrEqual(9)
  })

  test('panda requires 250 xp (Ответственный)', () => {
    const panda = ANIMAL_AVATARS.find(a => a.id === 'panda')
    expect(panda.minXp).toBe(250)
  })

  test('koala requires 800 xp (Семейный карандаш)', () => {
    const koala = ANIMAL_AVATARS.find(a => a.id === 'koala')
    expect(koala.minXp).toBe(800)
  })

  test('lion requires 2000 xp (Опора семьи)', () => {
    const lion = ANIMAL_AVATARS.find(a => a.id === 'lion')
    expect(lion.minXp).toBe(2000)
  })

  test('unicorn requires 4500 xp (Легенда семьи)', () => {
    const unicorn = ANIMAL_AVATARS.find(a => a.id === 'unicorn')
    expect(unicorn.minXp).toBe(4500)
  })

  test('dragon requires 4500 xp (Легенда семьи)', () => {
    const dragon = ANIMAL_AVATARS.find(a => a.id === 'dragon')
    expect(dragon.minXp).toBe(4500)
  })

  test('each animal has id, emoji, name, minXp', () => {
    for (const a of ANIMAL_AVATARS) {
      expect(typeof a.id).toBe('string')
      expect(typeof a.emoji).toBe('string')
      expect(typeof a.name).toBe('string')
      expect(typeof a.minXp).toBe('number')
    }
  })
})

// ─── getAnimalAvatar ──────────────────────────────────────────────────────

describe('getAnimalAvatar', () => {
  test('returns cat by id', () => {
    const a = getAnimalAvatar('cat')
    expect(a.id).toBe('cat')
    expect(a.emoji).toBe('🐱')
  })

  test('falls back to first avatar for unknown id', () => {
    const a = getAnimalAvatar('unknown_id')
    expect(a).toEqual(ANIMAL_AVATARS[0])
  })

  test('returns dragon for legend tier', () => {
    const a = getAnimalAvatar('dragon')
    expect(a.minXp).toBe(4500)
  })
})

// ─── AVATAR_COLORS & AVATAR_PALETTE ──────────────────────────────────────

describe('AVATAR_COLORS', () => {
  test('has at least 8 colors', () => {
    expect(AVATAR_COLORS.length).toBeGreaterThanOrEqual(8)
  })

  test('violet is included', () => {
    expect(AVATAR_COLORS).toContain('violet')
  })

  test('every color in AVATAR_COLORS has a palette entry', () => {
    for (const c of AVATAR_COLORS) {
      expect(AVATAR_PALETTE[c]).toBeDefined()
      expect(typeof AVATAR_PALETTE[c].bg).toBe('string')
      expect(typeof AVATAR_PALETTE[c].text).toBe('string')
    }
  })
})

// ─── generateInviteCode ───────────────────────────────────────────────────

describe('generateInviteCode', () => {
  test('returns 6-character uppercase string', () => {
    const code = generateInviteCode()
    expect(code).toHaveLength(6)
    expect(code).toBe(code.toUpperCase())
  })

  test('generates unique codes', () => {
    const codes = new Set(Array.from({ length: 100 }, generateInviteCode))
    expect(codes.size).toBeGreaterThan(90)
  })
})

// ─── ROLE_LABELS ──────────────────────────────────────────────────────────

describe('ROLE_LABELS', () => {
  test('has parent, child, grandparent', () => {
    expect(Object.keys(ROLE_LABELS)).toEqual(expect.arrayContaining(['parent', 'child', 'grandparent']))
  })

  test('all values are non-empty strings', () => {
    for (const v of Object.values(ROLE_LABELS)) {
      expect(typeof v).toBe('string')
      expect(v.length).toBeGreaterThan(0)
    }
  })
})
