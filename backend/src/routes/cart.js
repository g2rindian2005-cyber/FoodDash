const express = require('express');
const { query, pool } = require('../db/pool');
const { asyncHandler } = require('../middleware/error');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Ensures the user has a cart row and returns its id
async function getOrCreateCart(userId) {
  const existing = await query('SELECT id FROM cart WHERE user_id = $1 LIMIT 1', [userId]);
  if (existing.rows.length) return existing.rows[0].id;
  const created = await query('INSERT INTO cart (user_id) VALUES ($1) RETURNING id', [userId]);
  return created.rows[0].id;
}

// GET /api/cart -> current user's cart items
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const cartId = await getOrCreateCart(req.user.id);
  const { rows } = await query(
    `SELECT ci.id, ci.quantity, f.id AS food_item_id, f.name, f.price, f.image_url, f.restaurant_id
       FROM cart_items ci
       JOIN food_items f ON f.id = ci.food_item_id
      WHERE ci.cart_id = $1
      ORDER BY ci.id`,
    [cartId]
  );
  res.json(rows);
}));

// POST /api/cart  { food_item_id, quantity } -> add / increment
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { food_item_id, quantity } = req.body;
  if (!food_item_id) return res.status(400).json({ message: 'food_item_id is required.' });
  const cartId = await getOrCreateCart(req.user.id);
  const qty = Math.max(1, Number(quantity) || 1);

  const existing = await query(
    'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND food_item_id = $2',
    [cartId, food_item_id]
  );
  if (existing.rows.length) {
    const { rows } = await query(
      'UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2 RETURNING *',
      [qty, existing.rows[0].id]
    );
    return res.status(200).json(rows[0]);
  }
  const { rows } = await query(
    'INSERT INTO cart_items (cart_id, food_item_id, quantity) VALUES ($1,$2,$3) RETURNING *',
    [cartId, food_item_id, qty]
  );
  res.status(201).json(rows[0]);
}));

// DELETE /api/cart/:id  -> remove one cart item
router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const cartId = await getOrCreateCart(req.user.id);
  const { rowCount } = await query(
    'DELETE FROM cart_items WHERE id = $1 AND cart_id = $2',
    [req.params.id, cartId]
  );
  if (!rowCount) return res.status(404).json({ message: 'Cart item not found.' });
  res.json({ message: 'Removed.' });
}));

// DELETE /api/cart  -> clear the whole cart
router.delete('/', requireAuth, asyncHandler(async (req, res) => {
  const cartId = await getOrCreateCart(req.user.id);
  await query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
  res.json({ message: 'Cart cleared.' });
}));

module.exports = router;
