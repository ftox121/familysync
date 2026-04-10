import pool from './index.js'

const createTables = async () => {
  try {
    await pool.query(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Families table
      CREATE TABLE IF NOT EXISTS families (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        invite_code VARCHAR(10) UNIQUE NOT NULL,
        owner_email VARCHAR(255) REFERENCES users(email),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Family members table
      CREATE TABLE IF NOT EXISTS family_members (
        id SERIAL PRIMARY KEY,
        family_id INTEGER REFERENCES families(id) ON DELETE CASCADE,
        user_email VARCHAR(255) REFERENCES users(email),
        display_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        avatar_color VARCHAR(20),
        points INTEGER DEFAULT 0,
        tasks_completed INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        achievements_json TEXT DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(family_id, user_email)
      );

      -- Tasks table
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        family_id INTEGER REFERENCES families(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'pending',
        assigned_to VARCHAR(255) REFERENCES users(email),
        created_by VARCHAR(255) REFERENCES users(email),
        due_date TIMESTAMP,
        points_reward INTEGER DEFAULT 0,
        is_quest BOOLEAN DEFAULT FALSE,
        min_participants INTEGER DEFAULT 1,
        reward_multiplier REAL DEFAULT 1,
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS quest_participants (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        user_email VARCHAR(255) REFERENCES users(email),
        status VARCHAR(20) DEFAULT 'joined',
        completed_at TIMESTAMP,
        UNIQUE(task_id, user_email)
      );

      -- Notifications table
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        family_id INTEGER REFERENCES families(id) ON DELETE CASCADE,
        user_email VARCHAR(255) REFERENCES users(email),
        title VARCHAR(255) NOT NULL,
        message TEXT,
        type VARCHAR(50),
        is_read BOOLEAN DEFAULT FALSE,
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_family_members_family ON family_members(family_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_family ON tasks(family_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_quest_participants_task ON quest_participants(task_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_email);
    `)

    await pool.query(`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS is_quest BOOLEAN DEFAULT FALSE;

      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS min_participants INTEGER DEFAULT 1;

      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS reward_multiplier REAL DEFAULT 1;

      UPDATE tasks
      SET is_quest = FALSE
      WHERE is_quest IS NULL;
    `)

    console.log('✅ Database tables created successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating tables:', error)
    process.exit(1)
  }
}

createTables()
