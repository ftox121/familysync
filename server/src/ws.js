import { WebSocketServer } from 'ws'
import jwt from 'jsonwebtoken'
import { parse } from 'url'

// familyId (string) -> Set of WebSocket connections
const rooms = new Map()

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws, req) => {
    const { query } = parse(req.url, true)
    const token = query.token

    if (!token) {
      ws.close(1008, 'Missing token')
      return
    }

    let userEmail
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      userEmail = decoded.email
    } catch {
      ws.close(1008, 'Invalid token')
      return
    }

    let familyId = null
    ws._userEmail = userEmail

    ws.on('message', raw => {
      try {
        const msg = JSON.parse(raw)
        if (msg.type === 'join' && msg.familyId) {
          // Leave previous room if any
          if (familyId) rooms.get(String(familyId))?.delete(ws)

          familyId = String(msg.familyId)
          if (!rooms.has(familyId)) rooms.set(familyId, new Set())
          rooms.get(familyId).add(ws)
          ws.send(JSON.stringify({ type: 'joined', familyId }))
        }
      } catch {}
    })

    ws.on('close', () => {
      if (familyId) rooms.get(familyId)?.delete(ws)
    })

    ws.on('error', () => {
      if (familyId) rooms.get(familyId)?.delete(ws)
    })
  })

  return wss
}

export function broadcast(familyId, event) {
  const room = rooms.get(String(familyId))
  if (!room || room.size === 0) return
  const payload = JSON.stringify(event)
  for (const ws of room) {
    if (ws.readyState === 1 /* OPEN */) ws.send(payload)
  }
}
