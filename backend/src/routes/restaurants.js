const express = require('express');
const { pool } = require('../db/pool');
const { asyncHandler } = require('../middleware/error');
const { requireOwner } = require('../middleware/auth');

const router = express.Router();

// GET /api/restaurants  (optional ?search=)
router.get('/', asyncHandler(async (req, res) => {
  const { search } = req.query;
  let sql = 'SELECT * FROM restaurants';
  const params = [];
  if (search) {
    params.push(`%${search}%`);
    sql += ` WHERE name ILIKE $1 OR cuisine ILIKE $1`;
  }
  sql += ' ORDER BY rating DESC, id ASC';
  const { rows } = await query(sql, params);
  res.json(rows);
}));

// GET /api/restaurants/:id  -> restaurant + its menu grouped nothing, just details
router.get('/:id', asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM restaurants WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Restaurant not found.' });
  res.json(rows[0]);
}));

// PUT /api/restaurants/:id  (owner) -> update details / offer / open status
router.put('/:id', requireOwner, asyncHandler(async (req, res) => {
  const { name, description, cuisine, image_url, delivery_time, price_for_two, address, is_open, offer_text } = req.body;
  const { rows } = await query(
    `UPDATE restaurants SET
       name          = COALESCE($1, name),
       description   = COALESCE($2, description),
       cuisine       = COALESCE($3, cuisine),
       image_url     = COALESCE($4, image_url),
       delivery_time = COALESCE($5, delivery_time),
       price_for_two = COALESCE($6, price_for_two),
       address       = COALESCE($7, address),
       is_open       = COALESCE($8, is_open),
       offer_text    = COALESCE($9, offer_text)
     WHERE id = $10
     RETURNING *`,
    [name, description, cuisine, image_url, delivery_time, price_for_two, address, is_open, offer_text, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Restaurant not found.' });
  res.json(rows[0]);
}));

// PATCH /api/restaurants/:id/status  (owner) -> quick open/close toggle
router.patch('/:id/status', requireOwner, asyncHandler(async (req, res) => {
  const { is_open } = req.body;
  const { rows } = await query(
    'UPDATE restaurants SET is_open = $1 WHERE id = $2 RETURNING *',
    [Boolean(is_open), req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Restaurant not found.' });
  res.json(rows[0]);
}));

module.exports = router;
