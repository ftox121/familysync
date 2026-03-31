import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const dbUrl = process.env.DATABASE_URL || ''
const useSsl = dbUrl.includes('supabase.com') || dbUrl.includes('pooler.supabase.com')

const pool = new Pool({
  connectionString: dbUrl,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
})

export const query = (text, params) => pool.query(text, params)

export default pool
