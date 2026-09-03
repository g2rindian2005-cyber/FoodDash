const express = require('express');
const { query } = require('../db/pool');
const { asyncHandler } = require('../middleware/error');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/favorites -> the current user's favorite restaurants (full details)
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT r.* FROM favorites f
       JOIN restaurants r ON r.id = f.restaurant_id
      WHERE f.user_id = $1
      ORDER BY f.id DESC`,
    [req.user.id]
  );
  res.json(rows);
}));

// POST /api/favorites  { restaurant_id } -> add a favorite (idempotent)
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { restaurant_id } = req.body;
  if (!restaurant_id) return res.status(400).json({ message: 'restaurant_id is required.' });
  await query(
    `INSERT INTO favorites (user_id, restaurant_id) VALUES ($1,$2)
     ON CONFLICT (user_id, restaurant_id) DO NOTHING`,
    [req.user.id, restaurant_id]
  );
  res.status(201).json({ favorited: true });
}));

// DELETE /api/favorites/:restaurantId -> remove a favorite
router.delete('/:restaurantId', requireAuth, asyncHandler(async (req, res) => {
  await query(
    'DELETE FROM favorites WHERE user_id = $1 AND restaurant_id = $2',
    [req.user.id, req.params.restaurantId]
  );
  res.json({ favorited: false });
}));

module.exports = router;
