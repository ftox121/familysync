import pool from './index.js'

const createFamilyMessagesTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS family_messages (
        id SERIAL PRIMARY KEY,
        family_id INTEGER REFERENCES families(id) ON DELETE CASCADE,
        user_email VARCHAR(255) REFERENCES users(email),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_family_messages_family ON family_messages(family_id);
    `)

    console.log('✅ Family messages table created successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating family messages table:', error)
    process.exit(1)
  }
}

createFamilyMessagesTable()
