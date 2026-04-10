import pool from './index.js'

const addQuestAndRewardFields = async () => {
  try {
    await pool.query(`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS is_quest BOOLEAN DEFAULT FALSE;

      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS min_participants INTEGER DEFAULT 1;

      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS reward_multiplier REAL DEFAULT 1;

      ALTER TABLE rewards
      ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'item';

      ALTER TABLE rewards
      ADD COLUMN IF NOT EXISTS rarity VARCHAR(20) DEFAULT 'common';

      ALTER TABLE rewards
      ADD COLUMN IF NOT EXISTS duration_hours INTEGER;

      ALTER TABLE reward_claims
      ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP;

      ALTER TABLE reward_claims
      ADD COLUMN IF NOT EXISTS active_until TIMESTAMP;

      CREATE TABLE IF NOT EXISTS quest_participants (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        user_email VARCHAR(255) REFERENCES users(email),
        status VARCHAR(20) DEFAULT 'joined',
        completed_at TIMESTAMP,
        UNIQUE(task_id, user_email)
      );

      CREATE INDEX IF NOT EXISTS idx_quest_participants_task ON quest_participants(task_id);
      CREATE INDEX IF NOT EXISTS idx_quest_participants_user ON quest_participants(user_email);

      ALTER TABLE rewards
      DROP CONSTRAINT IF EXISTS rewards_type_check;

      ALTER TABLE rewards
      DROP CONSTRAINT IF EXISTS rewards_rarity_check;

      ALTER TABLE rewards
      ADD CONSTRAINT rewards_type_check CHECK (type IN ('item', 'artifact', 'privilege'));

      ALTER TABLE rewards
      ADD CONSTRAINT rewards_rarity_check CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'));

      ALTER TABLE tasks
      DROP CONSTRAINT IF EXISTS tasks_min_participants_check;

      ALTER TABLE tasks
      ADD CONSTRAINT tasks_min_participants_check CHECK (min_participants >= 1);

      ALTER TABLE tasks
      DROP CONSTRAINT IF EXISTS tasks_reward_multiplier_check;

      ALTER TABLE tasks
      ADD CONSTRAINT tasks_reward_multiplier_check CHECK (reward_multiplier >= 1);
    `)

    console.log('✅ Added quest and reward fields successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error adding quest and reward fields:', error)
    process.exit(1)
  }
}

addQuestAndRewardFields()
