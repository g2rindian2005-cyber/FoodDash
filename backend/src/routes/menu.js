const express = require('express');
const { query } = require('../db/pool');
const { asyncHandler } = require('../middleware/error');
const { requireOwner } = require('../middleware/auth');

const router = express.Router();

// GET /api/menu/:restaurantId  -> food items grouped by category
router.get('/:restaurantId', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT f.*, c.name AS category_name
       FROM food_items f
       LEFT JOIN categories c ON c.id = f.category_id
      WHERE f.restaurant_id = $1
      ORDER BY c.id NULLS LAST, f.id`,
    [req.params.restaurantId]
  );
  res.json(rows);
}));

// POST /api/menu  (owner) -> add a food item
router.post('/', requireOwner, asyncHandler(async (req, res) => {
  const { restaurant_id, category_id, name, description, price, image_url, is_veg } = req.body;
  if (!restaurant_id || !name || price == null) {
    return res.status(400).json({ message: 'restaurant_id, name and price are required.' });
  }
  const { rows } = await query(
    `INSERT INTO food_items (restaurant_id, category_id, name, description, price, image_url, is_veg)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [restaurant_id, category_id || null, name, description || null, price, image_url || null, is_veg !== false]
  );
  res.status(201).json(rows[0]);
}));

// PUT /api/menu/:id  (owner) -> update a food item
router.put('/:id', requireOwner, asyncHandler(async (req, res) => {
  const { name, description, price, image_url, is_veg, is_available } = req.body;
  const { rows } = await query(
    `UPDATE food_items SET
       name         = COALESCE($1, name),
       description  = COALESCE($2, description),
       price        = COALESCE($3, price),
       image_url    = COALESCE($4, image_url),
       is_veg       = COALESCE($5, is_veg),
       is_available = COALESCE($6, is_available)
     WHERE id = $7 RETURNING *`,
    [name, description, price, image_url, is_veg, is_available, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Food item not found.' });
  res.json(rows[0]);
}));

// DELETE /api/menu/:id  (owner)
router.delete('/:id', requireOwner, asyncHandler(async (req, res) => {
  const { rowCount } = await query('DELETE FROM food_items WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ message: 'Food item not found.' });
  res.json({ message: 'Deleted.' });
}));

module.exports = router;
