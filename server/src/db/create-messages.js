import pool from './index.js'

const createMessagesTable = async () => {
  try {
    await pool.query(`
      -- Messages table for task discussions
      CREATE TABLE IF NOT EXISTS task_messages (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        user_email VARCHAR(255) REFERENCES users(email),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_task_messages_task ON task_messages(task_id);
    `)

    console.log('✅ Messages table created successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating messages table:', error)
    process.exit(1)
  }
}

createMessagesTable()
