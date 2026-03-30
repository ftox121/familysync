import express from 'express'
import { query } from '../db/index.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Get notifications for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE user_email = $1 ORDER BY created_date DESC LIMIT 50',
      [req.user.email]
    )
    res.json(result.rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

// Create notification
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { family_id, user_email, title, message, type } = req.body

    const result = await query(
      `INSERT INTO notifications (family_id, user_email, title, message, type)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [family_id, user_email, title, message, type]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to create notification' })
  }
})

// Mark notification as read
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'UPDATE notifications SET is_read = $1 WHERE id = $2 RETURNING *',
      [req.body.is_read, req.params.id]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to update notification' })
  }
})

export default router
