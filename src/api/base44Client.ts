import AsyncStorage from '@react-native-async-storage/async-storage'

const PREFIX = 'b44_'

async function store(key: string, val: any) {
  await AsyncStorage.setItem(PREFIX + key, JSON.stringify(val))
}
async function load(key: string, fallback: any = []) {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function makeEntity(name: string) {
  return {
    async filter(query: Record<string, any> = {}, sort?: string, limit?: number) {
      let rows: any[] = await load(name)
      rows = rows.filter(row =>
        Object.entries(query).every(([k, v]) => row[k] === v)
      )
      if (sort) {
        const desc = sort.startsWith('-')
        const field = desc ? sort.slice(1) : sort
        rows.sort((a, b) => (a[field] < b[field] ? -1 : 1) * (desc ? -1 : 1))
      }
      if (limit) rows = rows.slice(0, limit)
      return rows
    },
    async create(data: Record<string, any>) {
      const rows: any[] = await load(name)
      const row = { id: uid(), created_date: new Date().toISOString(), ...data }
      rows.push(row)
      await store(name, rows)
      return row
    },
    async update(id: string, data: Record<string, any>) {
      const rows: any[] = (await load(name)).map((r: any) =>
        r.id === id ? { ...r, ...data } : r
      )
      await store(name, rows)
      return rows.find((r: any) => r.id === id)
    },
    async delete(id: string) {
      const rows: any[] = await load(name)
      await store(name, rows.filter((r: any) => r.id !== id))
    },
  }
}

const DEFAULT_USER = {
  id: 'local-user',
  email: 'you@example.com',
  full_name: 'Пользователь',
}

export const base44 = {
  auth: {
    async me() {
      const saved = await AsyncStorage.getItem(PREFIX + '__user')
      return saved ? JSON.parse(saved) : DEFAULT_USER
    },
    async logout() {
      await AsyncStorage.clear()
    },
  },
  entities: {
    Family:       makeEntity('Family'),
    FamilyMember: makeEntity('FamilyMember'),
    Task:         makeEntity('Task'),
    Notification: makeEntity('Notification'),
  },
}
