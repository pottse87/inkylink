import { Pool } from 'pg';

let _pool;
/**
 * Shared Postgres pool.
 * Uses DATABASE_URL; set PGSSLMODE=disable or DB_SSL=0/false to turn off SSL.
 */
export function getPool() {
  if (_pool) return _pool;
  const cs = process.env.DATABASE_URL;
  if (!cs) throw new Error('DATABASE_URL not configured');

  const ssl = (process.env.PGSSLMODE === 'disable'
            || process.env.DB_SSL === '0'
            || process.env.DB_SSL === 'false')
    ? false
    : { rejectUnauthorized: false };

  _pool = new Pool({ connectionString: cs, ssl });
  return _pool;
}

export default getPool;
