import express from 'express'
import { query } from '../db/index.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Get rewards for family
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { family_id } = req.query

    const result = await query(
      'SELECT * FROM rewards WHERE family_id = $1 ORDER BY points_cost ASC',
      [family_id]
    )
    res.json(result.rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch rewards' })
  }
})

// Create reward (parents only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { family_id, title, description, points_cost, icon } = req.body

    const result = await query(
      `INSERT INTO rewards (family_id, title, description, points_cost, icon, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [family_id, title, description, points_cost, icon, req.user.email]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to create reward' })
  }
})

// Claim reward (children)
router.post('/:id/claim', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `INSERT INTO reward_claims (reward_id, user_email, status)
       VALUES ($1, $2, 'pending') RETURNING *`,
      [req.params.id, req.user.email]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to claim reward' })
  }
})

// Get reward claims
router.get('/claims', authMiddleware, async (req, res) => {
  try {
    const { family_id } = req.query

    const result = await query(
      `SELECT rc.*, r.title, r.points_cost, r.icon
       FROM reward_claims rc
       JOIN rewards r ON rc.reward_id = r.id
       WHERE r.family_id = $1
       ORDER BY rc.claimed_at DESC`,
      [family_id]
    )
    res.json(result.rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch claims' })
  }
})

// Approve/reject claim (parents only)
router.put('/claims/:id', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body

    const result = await query(
      `UPDATE reward_claims 
       SET status = $1, approved_at = CURRENT_TIMESTAMP, approved_by = $2
       WHERE id = $3 RETURNING *`,
      [status, req.user.email, req.params.id]
    )

    // If approved, deduct points from user
    if (status === 'approved') {
      const claim = result.rows[0]
      const reward = await query('SELECT points_cost FROM rewards WHERE id = $1', [claim.reward_id])
      
      await query(
        'UPDATE family_members SET points = points - $1 WHERE user_email = $2',
        [reward.rows[0].points_cost, claim.user_email]
      )
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to update claim' })
  }
})

export default router
