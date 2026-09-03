/**
 * Runs schema.sql against the configured database.
 * Usage:  npm run migrate
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');

(async () => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('✅ Migration complete — all tables created.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
