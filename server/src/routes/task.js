import express from 'express'
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

// Get tasks for family
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { family_id } = req.query

    const result = await query(
      'SELECT * FROM tasks WHERE family_id = $1 ORDER BY created_date DESC',
      [family_id]
    )
    res.json(result.rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
})

// Get single task
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT * FROM tasks WHERE id = $1', [req.params.id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch task' })
  }
})

// Create task
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      family_id,
      title,
      description,
      category,
      priority,
      status,
      assigned_to,
      due_date,
      points_reward,
    } = req.body

    const membership = await getMembership(family_id, req.user.email)
    if (!membership || !['parent', 'grandparent'].includes(membership.role))
      return res.status(403).json({ error: 'Only parents can create tasks' })

    if (assigned_to) {
      const assignee = await getMembership(family_id, assigned_to)
      if (!assignee) return res.status(400).json({ error: 'Assignee is not in this family' })
      if (assignee.role !== 'child')
        return res.status(400).json({ error: 'Tasks can be assigned only to child profiles' })
    }

    const result = await query(
      `INSERT INTO tasks (family_id, title, description, category, priority, status, assigned_to, created_by, due_date, points_reward)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [family_id, title, description, category, priority, status, assigned_to, req.user.email, due_date, points_reward]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to create task' })
  }
})

// Update task
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const updates = []
    const values = []
    let paramCount = 1

    Object.entries(req.body).forEach(([key, value]) => {
      updates.push(`${key} = $${paramCount}`)
      values.push(value)
      paramCount++
    })

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(req.params.id)

    const result = await query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to update task' })
  }
})

// Delete task
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM tasks WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to delete task' })
  }
})

export default router
