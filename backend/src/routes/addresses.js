const express = require('express');
const { query } = require('../db/pool');
const { asyncHandler } = require('../middleware/error');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/addresses -> current user's saved addresses
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(
    'SELECT * FROM addresses WHERE user_id = $1 ORDER BY id DESC',
    [req.user.id]
  );
  res.json(rows);
}));

// POST /api/addresses
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { label, line1, line2, city, state, pincode, phone } = req.body;
  if (!line1 || !city || !pincode) {
    return res.status(400).json({ message: 'line1, city and pincode are required.' });
  }
  const { rows } = await query(
    `INSERT INTO addresses (user_id, label, line1, line2, city, state, pincode, phone)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.user.id, label || 'Home', line1, line2 || null, city, state || null, pincode, phone || null]
  );
  res.status(201).json(rows[0]);
}));

module.exports = router;
