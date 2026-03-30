import express from 'express'
import { query } from '../db/index.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Get user's families
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT f.* FROM families f
       JOIN family_members fm ON f.id = fm.family_id
       WHERE fm.user_email = $1`,
      [req.user.email]
    )
    res.json(result.rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch families' })
  }
})

// Create family
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, invite_code } = req.body

    const result = await query(
      'INSERT INTO families (name, invite_code, owner_email) VALUES ($1, $2, $3) RETURNING *',
      [name, invite_code, req.user.email]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to create family' })
  }
})

// Get family members
router.get('/:familyId/members', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM family_members WHERE family_id = $1 ORDER BY points DESC',
      [req.params.familyId]
    )
    res.json(result.rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch members' })
  }
})

// Add family member
router.post('/:familyId/members', authMiddleware, async (req, res) => {
  try {
    const { user_email, display_name, role, avatar_color } = req.body

    const result = await query(
      `INSERT INTO family_members (family_id, user_email, display_name, role, avatar_color)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.familyId, user_email, display_name, role, avatar_color]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to add member' })
  }
})

// Update family member
router.put('/members/:memberId', authMiddleware, async (req, res) => {
  try {
    const updates = []
    const values = []
    let paramCount = 1

    Object.entries(req.body).forEach(([key, value]) => {
      updates.push(`${key} = $${paramCount}`)
      values.push(value)
      paramCount++
    })

    values.push(req.params.memberId)

    const result = await query(
      `UPDATE family_members SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to update member' })
  }
})

export default router
