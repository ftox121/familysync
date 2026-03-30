/**
 * Base44 SDK client stub.
 *
 * When running inside the Base44 platform, replace this entire file with:
 *   import { base44 } from '@/api/base44Client'
 * and make sure the real SDK is installed.
 *
 * For standalone development, this stub stores data in localStorage so
 * you can develop without a backend.
 */

const PREFIX = 'b44_'

function store(key, val) {
  localStorage.setItem(PREFIX + key, JSON.stringify(val))
}
function load(key, fallback = []) {
  try { return JSON.parse(localStorage.getItem(PREFIX + key)) ?? fallback } catch { return fallback }
}
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

function makeEntity(name) {
  return {
    async filter(query = {}, sort, limit) {
      let rows = load(name)
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
    async create(data) {
      const rows = load(name)
      const row = { id: uid(), created_date: new Date().toISOString(), ...data }
      rows.push(row)
      store(name, rows)
      return row
    },
    async update(id, data) {
      const rows = load(name).map(r => (r.id === id ? { ...r, ...data } : r))
      store(name, rows)
      return rows.find(r => r.id === id)
    },
    async delete(id) {
      store(name, load(name).filter(r => r.id !== id))
    },
  }
}

let _mockUser = load('__user', null) || {
  id: 'local-user',
  email: 'you@example.com',
  full_name: 'Пользователь',
}

export const base44 = {
  auth: {
    async me() { return _mockUser },
    async logout() { window.location.reload() },
  },
  entities: {
    Family:       makeEntity('Family'),
    FamilyMember: makeEntity('FamilyMember'),
    Task:         makeEntity('Task'),
    Notification: makeEntity('Notification'),
  },
}
