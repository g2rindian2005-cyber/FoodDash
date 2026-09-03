const express = require('express');
const { query } = require('../db/pool');
const { asyncHandler } = require('../middleware/error');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/reviews/:restaurantId -> reviews for one restaurant, newest first
router.get('/:restaurantId', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT rv.*, u.name AS user_name
       FROM reviews rv
       JOIN users u ON u.id = rv.user_id
      WHERE rv.restaurant_id = $1
      ORDER BY rv.created_at DESC
      LIMIT 50`,
    [req.params.restaurantId]
  );
  const avgRes = await query(
    'SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS avg_rating, COUNT(*) AS total FROM reviews WHERE restaurant_id = $1',
    [req.params.restaurantId]
  );
  res.json({ reviews: rows, summary: avgRes.rows[0] });
}));

// POST /api/reviews  { restaurant_id, rating, comment }
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { restaurant_id, rating, comment } = req.body;
  const r = Number(rating);
  if (!restaurant_id || !r || r < 1 || r > 5) {
    return res.status(400).json({ message: 'restaurant_id and a rating between 1-5 are required.' });
  }
  const { rows } = await query(
    `INSERT INTO reviews (user_id, restaurant_id, rating, comment)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.id, restaurant_id, r, comment || null]
  );

  // Keep restaurants.rating roughly in sync with the new average.
  await query(
    `UPDATE restaurants SET rating = (
       SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE restaurant_id = $1
     ) WHERE id = $1`,
    [restaurant_id]
  );

  res.status(201).json(rows[0]);
}));

module.exports = router;
