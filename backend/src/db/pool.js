/**
 * PostgreSQL connection pool.
 * All queries in the app go through this single shared pool.
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'fooduser',
  password: process.env.PGPASSWORD || 'foodpass',
  database: process.env.PGDATABASE || 'fooddb',
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

// Small helper so routes can do: const { rows } = await query(sql, params)
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
