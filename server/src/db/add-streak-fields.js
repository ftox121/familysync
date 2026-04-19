import pool from './index.js'

const addStreakFields = async () => {
  try {
    await pool.query(`
      ALTER TABLE family_members
      ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0;

      ALTER TABLE family_members
      ADD COLUMN IF NOT EXISTS on_time_streak INTEGER DEFAULT 0;

      ALTER TABLE family_members
      ADD COLUMN IF NOT EXISTS last_task_completed_at TIMESTAMP;
    `)

    console.log('✅ Added streak fields to family_members')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error adding streak fields:', error)
    process.exit(1)
  }
}

addStreakFields()
