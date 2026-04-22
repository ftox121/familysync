import express from 'express'
import { query } from '../db/index.js'
import { authMiddleware } from '../middleware/auth.js'
import { broadcast } from '../ws.js'

const router = express.Router()

const ALLOWED_TYPES = ['item', 'artifact', 'privilege']
const ALLOWED_RARITIES = ['common', 'rare', 'epic', 'legendary']

function normalizeRewardType(type) {
  if (!type) return 'item'
  return String(type).toLowerCase()
}

function normalizeRewardRarity(rarity) {
  if (!rarity) return 'common'
  return String(rarity).toLowerCase()
}

function normalizeDurationHours(durationHours) {
  if (durationHours === undefined || durationHours === null || durationHours === '') return null

  const parsed = Number(durationHours)
  if (!Number.isInteger(parsed) || parsed <= 0) return null

  return parsed
}

async function getMembershipByFamily(familyId, email) {
  const result = await query(
    'SELECT * FROM family_members WHERE family_id = $1 AND user_email = $2 LIMIT 1',
    [familyId, email]
  )
  return result.rows[0] || null
}

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
    const { family_id, title, description, points_cost, icon, type, rarity, duration_hours } = req.body

    const normalizedType = normalizeRewardType(type)
    const normalizedRarity = normalizeRewardRarity(rarity)
    if (!ALLOWED_TYPES.includes(normalizedType)) {
      return res.status(400).json({ error: 'Invalid reward type' })
    }
    if (!ALLOWED_RARITIES.includes(normalizedRarity)) {
      return res.status(400).json({ error: 'Invalid reward rarity' })
    }

    if (
      duration_hours !== undefined
      && duration_hours !== null
      && duration_hours !== ''
      && normalizeDurationHours(duration_hours) === null
    ) {
      return res.status(400).json({ error: 'duration_hours must be a positive integer' })
    }

    const membership = await getMembershipByFamily(family_id, req.user.email)
    if (!membership || !['parent', 'grandparent'].includes(membership.role))
      return res.status(403).json({ error: 'Only parents can create rewards' })

    const result = await query(
      `INSERT INTO rewards (family_id, title, description, points_cost, icon, type, rarity, duration_hours, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        family_id,
        title,
        description,
        points_cost,
        icon,
        normalizedType,
        normalizedRarity,
        normalizeDurationHours(duration_hours),
        req.user.email,
      ]
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
    const rewardResult = await query('SELECT * FROM rewards WHERE id = $1 LIMIT 1', [req.params.id])
    const reward = rewardResult.rows[0]
    if (!reward) return res.status(404).json({ error: 'Reward not found' })

    const membership = await getMembershipByFamily(reward.family_id, req.user.email)
    if (!membership || membership.role !== 'child')
      return res.status(403).json({ error: 'Only child accounts can claim rewards' })

    if ((membership.points || 0) < reward.points_cost)
      return res.status(400).json({ error: 'Not enough points' })

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
       `SELECT rc.*, r.title, r.points_cost, r.icon, r.type, r.rarity, r.duration_hours
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

// Redeem reward immediately (game-like flow)
// Parents can redeem on behalf of a child by passing { member_email } in the body
router.post('/:id/redeem', authMiddleware, async (req, res) => {
  try {
    const rewardResult = await query('SELECT * FROM rewards WHERE id = $1 LIMIT 1', [req.params.id])
    const reward = rewardResult.rows[0]
    if (!reward) return res.status(404).json({ error: 'Reward not found' })

    const callerMembership = await getMembershipByFamily(reward.family_id, req.user.email)
    if (!callerMembership) return res.status(403).json({ error: 'Not a family member' })

    let targetMembership = callerMembership

    if (callerMembership.role !== 'child') {
      if (!['parent', 'grandparent'].includes(callerMembership.role))
        return res.status(403).json({ error: 'Only parents and children can redeem rewards' })
      const { member_email } = req.body
      if (!member_email) return res.status(400).json({ error: 'Укажите member_email для покупки от имени ребёнка' })
      targetMembership = await getMembershipByFamily(reward.family_id, member_email)
      if (!targetMembership || targetMembership.role !== 'child')
        return res.status(400).json({ error: 'Целевой участник должен быть ребёнком' })
    }

    if ((targetMembership.points || 0) < reward.points_cost)
      return res.status(400).json({ error: 'Not enough points' })

    await query('UPDATE family_members SET points = points - $1 WHERE id = $2', [reward.points_cost, targetMembership.id])

    const nowExpr = "CURRENT_TIMESTAMP"
    const activeUntilExpr = reward.type === 'artifact' && reward.duration_hours
      ? `CURRENT_TIMESTAMP + ($4 || ' hours')::interval`
      : 'NULL'
    const status = reward.type === 'artifact' ? 'active' : 'approved'

    const result = await query(
      `INSERT INTO reward_claims (reward_id, user_email, status, approved_at, activated_at, active_until, approved_by)
       VALUES ($1, $2, $3, ${nowExpr}, ${reward.type === 'artifact' ? nowExpr : 'NULL'}, ${activeUntilExpr}, NULL)
       RETURNING *`,
      reward.type === 'artifact'
        ? [reward.id, targetMembership.user_email, status, reward.duration_hours]
        : [reward.id, targetMembership.user_email, status]
    )

    broadcast(reward.family_id, { type: 'members_updated' })
    broadcast(reward.family_id, { type: 'reward_claims_updated' })
    res.json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to redeem reward' })
  }
})

// Delete reward (parents only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const rewardResult = await query('SELECT * FROM rewards WHERE id = $1 LIMIT 1', [req.params.id])
    const reward = rewardResult.rows[0]
    if (!reward) return res.status(404).json({ error: 'Reward not found' })

    const membership = await getMembershipByFamily(reward.family_id, req.user.email)
    if (!membership || !['parent', 'grandparent'].includes(membership.role))
      return res.status(403).json({ error: 'Only parents can delete rewards' })

    await query('DELETE FROM reward_claims WHERE reward_id = $1', [req.params.id])
    await query('DELETE FROM rewards WHERE id = $1', [req.params.id])
    broadcast(reward.family_id, { type: 'reward_claims_updated' })
    broadcast(reward.family_id, { type: 'members_updated' })
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to delete reward' })
  }
})

// Approve/reject claim (parents only)
router.put('/claims/:id', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body

    const claimLookup = await query(
      `SELECT rc.*, r.family_id, r.points_cost
       FROM reward_claims rc
       JOIN rewards r ON rc.reward_id = r.id
       WHERE rc.id = $1 LIMIT 1`,
      [req.params.id]
    )
    const claimRow = claimLookup.rows[0]
    if (!claimRow) return res.status(404).json({ error: 'Claim not found' })

    const membership = await getMembershipByFamily(claimRow.family_id, req.user.email)
    if (!membership || !['parent', 'grandparent'].includes(membership.role))
      return res.status(403).json({ error: 'Only parents can review claims' })

    const result = await query(
      `UPDATE reward_claims 
       SET status = $1, approved_at = CURRENT_TIMESTAMP, approved_by = $2
       WHERE id = $3 RETURNING *`,
      [status, req.user.email, req.params.id]
    )

    // If approved, deduct points from user
    if (status === 'approved') {
      const claim = result.rows[0]
      await query(
        'UPDATE family_members SET points = points - $1 WHERE user_email = $2',
        [claimRow.points_cost, claim.user_email]
      )
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to update claim' })
  }
})

export default router
