import http from 'http'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import familyRoutes from './routes/family.js'
import taskRoutes from './routes/task.js'
import notificationRoutes from './routes/notification.js'
import rewardRoutes from './routes/reward.js'
import messageRoutes from './routes/message.js'
import { setupWebSocket } from './ws.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/families', familyRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/rewards', rewardRoutes)
app.use('/api/tasks', messageRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

const server = http.createServer(app)
setupWebSocket(server)

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`🔌 WebSocket ready on ws://localhost:${PORT}/ws`)
})
