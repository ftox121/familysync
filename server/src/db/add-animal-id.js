import pool from './index.js'

const addAnimalIdColumn = async () => {
  try {
    await pool.query(`
      -- Add animal_id column to family_members
      ALTER TABLE family_members 
      ADD COLUMN IF NOT EXISTS animal_id VARCHAR(50);
    `)

    console.log('✅ Added animal_id column successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error adding column:', error)
    process.exit(1)
  }
}

addAnimalIdColumn()
