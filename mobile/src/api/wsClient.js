// WebSocket client singleton.
// Connects once per app session; on event triggers query invalidation via listeners.
// Reconnects automatically on disconnect with exponential back-off.

const RECONNECT_BASE_MS = 2000
const RECONNECT_MAX_MS = 30000

class WSClient {
  constructor() {
    this._ws = null
    this._listeners = new Set()
    this._url = null
    this._familyId = null
    this._reconnectDelay = RECONNECT_BASE_MS
    this._reconnectTimer = null
    this._intentionalClose = false
  }

  connect(wsBaseUrl, token, familyId) {
    this._url = `${wsBaseUrl}?token=${encodeURIComponent(token)}`
    this._familyId = familyId
    this._intentionalClose = false
    this._open()
  }

  _open() {
    if (this._ws) {
      this._ws.onopen = null
      this._ws.onmessage = null
      this._ws.onerror = null
      this._ws.onclose = null
      try { this._ws.close() } catch {}
    }

    this._ws = new WebSocket(this._url)

    this._ws.onopen = () => {
      this._reconnectDelay = RECONNECT_BASE_MS
      this._ws.send(JSON.stringify({ type: 'join', familyId: this._familyId }))
    }

    this._ws.onmessage = e => {
      try {
        const event = JSON.parse(e.data)
        this._listeners.forEach(cb => cb(event))
      } catch {}
    }

    this._ws.onerror = () => {}

    this._ws.onclose = () => {
      if (this._intentionalClose) return
      this._reconnectTimer = setTimeout(() => {
        this._reconnectDelay = Math.min(this._reconnectDelay * 1.5, RECONNECT_MAX_MS)
        this._open()
      }, this._reconnectDelay)
    }
  }

  addListener(cb) {
    this._listeners.add(cb)
    return () => this._listeners.delete(cb)
  }

  disconnect() {
    this._intentionalClose = true
    clearTimeout(this._reconnectTimer)
    try { this._ws?.close() } catch {}
    this._ws = null
  }

  updateFamily(familyId) {
    if (familyId === this._familyId) return
    this._familyId = familyId
    if (this._ws?.readyState === 1) {
      this._ws.send(JSON.stringify({ type: 'join', familyId }))
    }
  }
}

export const wsClient = new WSClient()
