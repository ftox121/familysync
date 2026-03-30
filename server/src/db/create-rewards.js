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
        approved_by VARCHAR(255) REFERENCES users(email)
      );

      CREATE INDEX IF NOT EXISTS idx_rewards_family ON rewards(family_id);
      CREATE INDEX IF NOT EXISTS idx_reward_claims_user ON reward_claims(user_email);
    `)

    console.log('✅ Rewards tables created successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating rewards tables:', error)
    process.exit(1)
  }
}

createRewardsTable()
