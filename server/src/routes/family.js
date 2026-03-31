import express from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../db/index.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

async function getMembership(familyId, email) {
  const result = await query(
    'SELECT * FROM family_members WHERE family_id = $1 AND user_email = $2 LIMIT 1',
    [familyId, email]
  )
  return result.rows[0] || null
}

function isParentRole(role) {
  return role === 'parent' || role === 'grandparent'
}

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

// Join family by invite code
router.post('/join', authMiddleware, async (req, res) => {
  try {
    const { invite_code, display_name, role, avatar_color, animal_id } = req.body
    const code = String(invite_code || '').trim().toUpperCase()
    if (!code) return res.status(400).json({ error: 'Invite code is required' })

    const familyResult = await query('SELECT * FROM families WHERE invite_code = $1 LIMIT 1', [code])
    const family = familyResult.rows[0]
    if (!family) return res.status(404).json({ error: 'Family not found' })

    const existing = await getMembership(family.id, req.user.email)
    if (existing) return res.json({ family, member: existing })

    const memberResult = await query(
      `INSERT INTO family_members (family_id, user_email, display_name, role, avatar_color, animal_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        family.id,
        req.user.email,
        display_name || req.user.email,
        role || 'child',
        avatar_color || 'violet',
        animal_id || null,
      ]
    )

    await query(
      `INSERT INTO notifications (family_id, user_email, title, message, type)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        family.id,
        family.owner_email,
        'Новый участник!',
        `${display_name || req.user.email} присоединился к семье`,
        'family_invite',
      ]
    )

    res.json({ family, member: memberResult.rows[0] })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to join family' })
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
    const { user_email, display_name, role, avatar_color, animal_id } = req.body

    const result = await query(
      `INSERT INTO family_members (family_id, user_email, display_name, role, avatar_color, animal_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.familyId, user_email, display_name, role, avatar_color, animal_id || null]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to add member' })
  }
})

// Create child profile (parent-only)
router.post('/:familyId/children', authMiddleware, async (req, res) => {
  try {
    const familyId = Number(req.params.familyId)
    const membership = await getMembership(familyId, req.user.email)
    if (!membership || !isParentRole(membership.role))
      return res.status(403).json({ error: 'Only parents can add child profiles' })

    const { display_name, avatar_color, animal_id } = req.body
    if (!display_name) return res.status(400).json({ error: 'display_name is required' })

    const syntheticEmail = `child.${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 7)}@familysync.local`
    const passwordHash = await bcrypt.hash(`child-${Date.now()}`, 8)

    await query(
      'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3)',
      [syntheticEmail, passwordHash, display_name]
    )

    const memberResult = await query(
      `INSERT INTO family_members (family_id, user_email, display_name, role, avatar_color, animal_id, points, tasks_completed, level)
       VALUES ($1, $2, $3, 'child', $4, $5, 0, 0, 1) RETURNING *`,
      [familyId, syntheticEmail, display_name, avatar_color || 'violet', animal_id || null]
    )

    res.json(memberResult.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to create child profile' })
  }
})

// Get family chat messages
router.get('/:familyId/messages', authMiddleware, async (req, res) => {
  try {
    const familyId = Number(req.params.familyId)
    const membership = await getMembership(familyId, req.user.email)
    if (!membership) return res.status(403).json({ error: 'Access denied' })

    const result = await query(
      'SELECT * FROM family_messages WHERE family_id = $1 ORDER BY created_at ASC',
      [familyId]
    )
    res.json(result.rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch family messages' })
  }
})

// Send family chat message
router.post('/:familyId/messages', authMiddleware, async (req, res) => {
  try {
    const familyId = Number(req.params.familyId)
    const membership = await getMembership(familyId, req.user.email)
    if (!membership) return res.status(403).json({ error: 'Access denied' })

    const { message } = req.body
    if (!message || !String(message).trim())
      return res.status(400).json({ error: 'message is required' })

    const result = await query(
      `INSERT INTO family_messages (family_id, user_email, message)
       VALUES ($1, $2, $3) RETURNING *`,
      [familyId, req.user.email, String(message).trim()]
    )
    res.json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to send family message' })
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
