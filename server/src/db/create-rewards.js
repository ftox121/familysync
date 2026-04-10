import pool from './index.js'

const createRewardsTable = async () => {
  try {
    await pool.query(`
      -- Rewards table for children
      CREATE TABLE IF NOT EXISTS rewards (
        id SERIAL PRIMARY KEY,
        family_id INTEGER REFERENCES families(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        points_cost INTEGER NOT NULL,
        icon VARCHAR(50),
        type VARCHAR(20) DEFAULT 'item' CONSTRAINT rewards_type_check CHECK (type IN ('item', 'artifact', 'privilege')),
        rarity VARCHAR(20) DEFAULT 'common' CONSTRAINT rewards_rarity_check CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
        duration_hours INTEGER CONSTRAINT rewards_duration_hours_check CHECK (duration_hours IS NULL OR duration_hours > 0),
        created_by VARCHAR(255) REFERENCES users(email),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Reward claims table
      CREATE TABLE IF NOT EXISTS reward_claims (
        id SERIAL PRIMARY KEY,
        reward_id INTEGER REFERENCES rewards(id) ON DELETE CASCADE,
        user_email VARCHAR(255) REFERENCES users(email),
        status VARCHAR(50) DEFAULT 'pending',
        claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP,
        activated_at TIMESTAMP,
        active_until TIMESTAMP,
        approved_by VARCHAR(255) REFERENCES users(email)
      );

      CREATE INDEX IF NOT EXISTS idx_rewards_family ON rewards(family_id);
      CREATE INDEX IF NOT EXISTS idx_reward_claims_user ON reward_claims(user_email);
    `)

    await pool.query(`
      ALTER TABLE rewards
      ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'item';

      ALTER TABLE rewards
      ADD COLUMN IF NOT EXISTS rarity VARCHAR(20) DEFAULT 'common';

      ALTER TABLE rewards
      ADD COLUMN IF NOT EXISTS duration_hours INTEGER;

      UPDATE rewards
      SET rarity = 'common'
      WHERE rarity IS NULL;

      ALTER TABLE rewards
      DROP CONSTRAINT IF EXISTS rewards_type_check;

      ALTER TABLE rewards
      DROP CONSTRAINT IF EXISTS rewards_rarity_check;

      ALTER TABLE rewards
      DROP CONSTRAINT IF EXISTS rewards_duration_hours_check;

      ALTER TABLE rewards
      ADD CONSTRAINT rewards_type_check CHECK (type IN ('item', 'artifact', 'privilege'));

      ALTER TABLE rewards
      ADD CONSTRAINT rewards_rarity_check CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'));

      ALTER TABLE rewards
      ADD CONSTRAINT rewards_duration_hours_check CHECK (duration_hours IS NULL OR duration_hours > 0);

      ALTER TABLE reward_claims
      ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP;

      ALTER TABLE reward_claims
      ADD COLUMN IF NOT EXISTS active_until TIMESTAMP;
    `)

    console.log('✅ Rewards tables created successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating rewards tables:', error)
    process.exit(1)
  }
}

createRewardsTable()
