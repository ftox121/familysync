import express from 'express'
import { query } from '../db/index.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Get messages for task
router.get('/:taskId/messages', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM task_messages WHERE task_id = $1 ORDER BY created_at ASC',
      [req.params.taskId]
    )
    res.json(result.rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// Send message
router.post('/:taskId/messages', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body

    const result = await query(
      `INSERT INTO task_messages (task_id, user_email, message)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.params.taskId, req.user.email, message]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

export default router
