import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function check() {
  try {
    const res = await pool.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        rc.delete_rule,
        ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE ccu.table_name = 'ip_application'
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
check();