import express from 'express'
import { query } from '../db/index.js'
import { authMiddleware } from '../middleware/auth.js'
import { broadcast } from '../ws.js'

const router = express.Router()
let penaltyColumnsEnsured = false

function toBooleanOrDefault(value, defaultValue = false) {
  return typeof value === 'boolean' ? value : defaultValue
}

function toPositiveInt(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function toPositiveFloat(value, fallback = 1) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : fallback
}

function normalizeParticipantEmails(value) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter(Boolean).map(v => String(v).trim().toLowerCase()))]
}

async function getMembership(familyId, email) {
  const result = await query(
    'SELECT * FROM family_members WHERE family_id = $1 AND user_email = $2 LIMIT 1',
    [familyId, email]
  )
  return result.rows[0] || null
}

async function ensurePenaltyColumns() {
  if (penaltyColumnsEnsured) return

  await query(`
    ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS overdue_penalty_applied BOOLEAN DEFAULT FALSE;

    ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS overdue_penalty_points INTEGER DEFAULT 0;

    ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS overdue_penalty_applied_at TIMESTAMP;
  `)

  penaltyColumnsEnsured = true
}

function getDefaultTaskReward(task) {
  if (task.points_reward && task.points_reward > 0) return task.points_reward
  if (task.priority === 'high') return 20
  if (task.priority === 'low') return 5
  return 10
}

function getOverduePenaltyPoints(task) {
  const base = getDefaultTaskReward(task)
  return Math.max(5, Math.min(25, Math.round(base * 0.35)))
}

async function applyOverduePenalties(familyId) {
  if (!familyId) return 0
  await ensurePenaltyColumns()

  const overdueResult = await query(
    `SELECT *
     FROM tasks
     WHERE family_id = $1
       AND assigned_to IS NOT NULL
       AND status IN ('pending', 'in_progress', 'pending_confirmation')
       AND due_date IS NOT NULL
       AND COALESCE(overdue_penalty_applied, FALSE) = FALSE
       AND due_date::date < CURRENT_DATE`,
    [familyId]
  )

  let applied = 0

  for (const task of overdueResult.rows) {
    const membership = await getMembership(task.family_id, task.assigned_to)
    if (!membership) continue

    const penaltyPoints = getOverduePenaltyPoints(task)

    await query(
      `UPDATE family_members
       SET points = GREATEST(points - $1, 0),
           level = FLOOR(GREATEST(points - $1, 0) / 100) + 1
       WHERE id = $2`,
      [penaltyPoints, membership.id]
    )

    await query(
      `UPDATE tasks
       SET overdue_penalty_applied = TRUE,
           overdue_penalty_points = $1,
           overdue_penalty_applied_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [penaltyPoints, task.id]
    )

    await query(
      `INSERT INTO notifications (family_id, user_email, title, message, type)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        task.family_id,
        task.assigned_to,
        'Просрочка задачи',
        `С задания «${task.title}» списано ${penaltyPoints} ★ за пропущенный дедлайн.`,
        'task_overdue_penalty',
      ]
    )

    applied++
  }

  if (applied > 0) {
    broadcast(familyId, { type: 'members_updated' })
    broadcast(familyId, { type: 'tasks_updated' })
    broadcast(familyId, { type: 'notifications_updated' })
  }

  return applied
}

async function getTaskWithParticipants(taskId) {
  const result = await query(
    `SELECT t.*,
            COALESCE(
              json_agg(
                json_build_object(
                  'user_email', qp.user_email,
                  'status', qp.status,
                  'completed_at', qp.completed_at
                )
                ORDER BY qp.id
              ) FILTER (WHERE qp.id IS NOT NULL),
              '[]'
            ) AS participants
     FROM tasks t
     LEFT JOIN quest_participants qp ON qp.task_id = t.id
     WHERE t.id = $1
     GROUP BY t.id`,
    [taskId]
  )
  return result.rows[0] || null
}

async function awardQuestParticipants(task) {
  const participantsResult = await query('SELECT * FROM quest_participants WHERE task_id = $1', [task.id])

  const participants = participantsResult.rows
  const rewardAmount = Math.round((task.points_reward || 0) * (task.reward_multiplier || 1))

  for (const participant of participants) {
    await query(
      `UPDATE family_members
       SET points = points + $1,
           tasks_completed = tasks_completed + 1,
           level = FLOOR((points + $1) / 100) + 1
       WHERE family_id = $2 AND user_email = $3`,
      [rewardAmount, task.family_id, participant.user_email]
    )

    await query(
      `INSERT INTO notifications (family_id, user_email, title, message, type)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        task.family_id,
        participant.user_email,
        'Квест завершен!',
        `Вы получили ${rewardAmount} ★ за квест «${task.title}»`,
        'achievement',
      ]
    )
  }
}

// Get tasks for family
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { family_id } = req.query
    await applyOverduePenalties(family_id)

    const result = await query(
      `SELECT t.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'user_email', qp.user_email,
                    'status', qp.status,
                    'completed_at', qp.completed_at
                  )
                  ORDER BY qp.id
                ) FILTER (WHERE qp.id IS NOT NULL),
                '[]'
              ) AS participants
       FROM tasks t
       LEFT JOIN quest_participants qp ON qp.task_id = t.id
       WHERE t.family_id = $1
       GROUP BY t.id
       ORDER BY t.created_date DESC`,
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
    await ensurePenaltyColumns()
    const familyLookup = await query('SELECT family_id FROM tasks WHERE id = $1 LIMIT 1', [req.params.id])
    const familyId = familyLookup.rows[0]?.family_id
    if (familyId) await applyOverduePenalties(familyId)

    const task = await getTaskWithParticipants(req.params.id)

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.json(task)
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
      is_quest,
      min_participants,
      reward_multiplier,
      participant_emails,
    } = req.body

    const membership = await getMembership(family_id, req.user.email)
    if (!membership || !['parent', 'grandparent'].includes(membership.role))
      return res.status(403).json({ error: 'Only parents can create tasks' })

    const normalizedQuest = toBooleanOrDefault(is_quest)
    const normalizedParticipants = normalizeParticipantEmails(participant_emails)

    if (normalizedQuest) {
      if (normalizedParticipants.length === 0)
        return res.status(400).json({ error: 'Quest must have at least one participant' })

      for (const email of normalizedParticipants) {
        const participantMembership = await getMembership(family_id, email)
        if (!participantMembership)
          return res.status(400).json({ error: `Participant ${email} is not in this family` })
        if (participantMembership.role !== 'child')
          return res.status(400).json({ error: 'Quest participants must be child profiles' })
      }
    } else if (assigned_to) {
      const assignee = await getMembership(family_id, assigned_to)
      if (!assignee) return res.status(400).json({ error: 'Assignee is not in this family' })
      if (assignee.role !== 'child' && assigned_to !== req.user.email)
        return res.status(400).json({ error: 'Tasks can be assigned only to child profiles or yourself' })
    }

    const result = await query(
      `INSERT INTO tasks (
         family_id, title, description, category, priority, status,
         assigned_to, created_by, due_date, points_reward, is_quest, min_participants, reward_multiplier
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        family_id,
        title,
        description,
        category,
        priority,
        status,
        normalizedQuest ? null : assigned_to,
        req.user.email,
        due_date,
        points_reward ?? 0,
        normalizedQuest,
        normalizedQuest ? toPositiveInt(min_participants, Math.min(normalizedParticipants.length, 2) || 1) : 1,
        normalizedQuest ? toPositiveFloat(reward_multiplier, 1.5) : 1,
      ]
    )

    const task = result.rows[0]

    if (normalizedQuest) {
      for (const email of normalizedParticipants) {
        await query(
          'INSERT INTO quest_participants (task_id, user_email, status) VALUES ($1, $2, $3)',
          [task.id, email, 'joined']
        )
      }
    }

    const withParticipants = await getTaskWithParticipants(task.id)
    broadcast(family_id, { type: 'tasks_updated' })
    res.json(withParticipants)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to create task' })
  }
})

// Mark quest participation complete
router.post('/:id/participants/complete', authMiddleware, async (req, res) => {
  try {
    const task = await getTaskWithParticipants(req.params.id)
    if (!task) return res.status(404).json({ error: 'Task not found' })
    if (!task.is_quest) return res.status(400).json({ error: 'This task is not a quest' })

    const participant = task.participants.find(p => p.user_email === req.user.email)
    if (!participant) return res.status(403).json({ error: 'You are not a participant of this quest' })

    await query(
      'UPDATE quest_participants SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE task_id = $2 AND user_email = $3',
      ['completed', task.id, req.user.email]
    )

    const completedCountResult = await query(
      'SELECT COUNT(*)::int AS count FROM quest_participants WHERE task_id = $1 AND status = $2',
      [task.id, 'completed']
    )
    const completedCount = completedCountResult.rows[0]?.count || 0

    if (task.status !== 'completed' && completedCount >= (task.min_participants || 1)) {
      await query('UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['completed', task.id])
      await awardQuestParticipants(task)
    }

    const updatedTask = await getTaskWithParticipants(task.id)
    broadcast(task.family_id, { type: 'tasks_updated' })
    broadcast(task.family_id, { type: 'members_updated' })
    res.json(updatedTask)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to complete quest participation' })
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

    const updatedTask = result.rows[0]
    if (updatedTask?.family_id) {
      broadcast(updatedTask.family_id, { type: 'tasks_updated' })
      // Completing a task changes member points
      if (updatedTask.status === 'completed') {
        broadcast(updatedTask.family_id, { type: 'members_updated' })
      }
    }
    res.json(updatedTask)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to update task' })
  }
})

// Delete task
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await query('SELECT family_id FROM tasks WHERE id = $1', [req.params.id])
    await query('DELETE FROM tasks WHERE id = $1', [req.params.id])
    const familyId = existing.rows[0]?.family_id
    if (familyId) broadcast(familyId, { type: 'tasks_updated' })
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to delete task' })
  }
})

export default router
