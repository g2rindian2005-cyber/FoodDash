/**
 * Seeds the database:
 *   1. Creates a demo owner + demo customer (with bcrypt-hashed passwords)
 *   2. Runs seed.sql (restaurants, categories, food items)
 *   3. Links the owner to restaurant #1
 *
 * Usage:  npm run seed   (run AFTER `npm run migrate`)
 *
 * Demo credentials created here:
 *   Owner    ->  owner@food.com    / owner123
 *   Customer ->  customer@food.com / customer123
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('./pool');

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Demo users
    const ownerHash = await bcrypt.hash('owner123', 10);
    const custHash = await bcrypt.hash('customer123', 10);

    const ownerRes = await client.query(
      `INSERT INTO users (name, email, password_hash, phone, role)
       VALUES ($1,$2,$3,$4,'owner')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Restaurant Owner', 'owner@food.com', ownerHash, '9000000001']
    );
    await client.query(
      `INSERT INTO users (name, email, password_hash, phone, role)
       VALUES ($1,$2,$3,$4,'customer')
       ON CONFLICT (email) DO NOTHING`,
      ['Demo Customer', 'customer@food.com', custHash, '9000000002']
    );

    // 2. Restaurants / categories / food items
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await client.query(seedSql);

    // 3. Link owner to restaurant #1
    const ownerId = ownerRes.rows[0].id;
    await client.query(
      `INSERT INTO restaurant_owners (user_id, restaurant_id)
       VALUES ($1, 1)
       ON CONFLICT (user_id, restaurant_id) DO NOTHING`,
      [ownerId]
    );

    await client.query('COMMIT');
    console.log('✅ Seed complete.');
    console.log('   Owner    -> owner@food.com / owner123');
    console.log('   Customer -> customer@food.com / customer123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
