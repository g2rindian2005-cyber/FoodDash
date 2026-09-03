const express = require('express');
const { query } = require('../db/pool');
const { asyncHandler } = require('../middleware/error');
const { requireOwner } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/owner/stats
 * Returns the dashboard cards:
 *   todaysOrders, revenue, pendingOrders, completedOrders
 * Revenue counts delivered orders only.
 */
router.get('/stats', requireOwner, asyncHandler(async (req, res) => {
  const [todays, revenue, pending, completed] = await Promise.all([
    query(`SELECT COUNT(*)::int AS c FROM orders WHERE created_at::date = CURRENT_DATE`),
    query(`SELECT COALESCE(SUM(total),0)::float AS s FROM orders WHERE status = 'delivered'`),
    query(`SELECT COUNT(*)::int AS c FROM orders WHERE status IN ('pending','confirmed','preparing','out_for_delivery')`),
    query(`SELECT COUNT(*)::int AS c FROM orders WHERE status = 'delivered'`),
  ]);

  res.json({
    todaysOrders: todays.rows[0].c,
    revenue: revenue.rows[0].s,
    pendingOrders: pending.rows[0].c,
    completedOrders: completed.rows[0].c,
  });
}));

/**
 * GET /api/owner/restaurant
 * The restaurant(s) owned by the logged-in owner. Returns the first one.
 */
router.get('/restaurant', requireOwner, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT r.* FROM restaurants r
       JOIN restaurant_owners ro ON ro.restaurant_id = r.id
      WHERE ro.user_id = $1
      ORDER BY r.id LIMIT 1`,
    [req.user.id]
  );
  // Fallback to restaurant #1 so the demo owner always sees data
  if (!rows.length) {
    const fallback = await query('SELECT * FROM restaurants ORDER BY id LIMIT 1');
    return res.json(fallback.rows[0] || null);
  }
  res.json(rows[0]);
}));

module.exports = router;
