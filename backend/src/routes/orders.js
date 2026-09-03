const express = require('express');
const { query, pool } = require('../db/pool');
const { asyncHandler } = require('../middleware/error');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const VALID_STATUSES = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

// How long (in seconds) an order spends in each stage before auto-advancing.
// This lets order tracking work end-to-end even if no owner ever manually
// updates the status — it simulates a real kitchen + delivery timeline.
const STAGE_SECONDS = { confirmed: 20, preparing: 40, out_for_delivery: 60 };
const STAGE_ORDER = ['confirmed', 'preparing', 'out_for_delivery', 'delivered'];

/**
 * Given an order row, returns the status it SHOULD be at right now based on
 * elapsed time since creation — but never rewinds/overrides a manual
 * 'cancelled' status, and never advances past what the owner has already
 * explicitly set beyond 'confirmed'.
 */
function deriveLiveStatus(order) {
  if (order.status === 'cancelled' || order.status === 'delivered') return order.status;

  const elapsed = (Date.now() - new Date(order.created_at).getTime()) / 1000;
  let cursor = 0;
  let acc = 0;
  for (const stage of STAGE_ORDER.slice(0, -1)) {
    acc += STAGE_SECONDS[stage];
    if (elapsed >= acc) cursor += 1;
    else break;
  }
  const simulated = STAGE_ORDER[Math.min(cursor, STAGE_ORDER.length - 1)];

  // Never go backwards relative to a status an owner already set manually.
  const manualIdx = STAGE_ORDER.indexOf(order.status);
  const simulatedIdx = STAGE_ORDER.indexOf(simulated);
  return simulatedIdx > manualIdx ? simulated : order.status;
}

/**
 * POST /api/orders
 * body: {
 *   restaurant_id, address_id?, address?,   // address can be inline object
 *   items: [{ food_item_id, name, price, quantity }],
 *   delivery_fee?, taxes?
 * }
 * Creates order + order_items in a transaction and returns the full order.
 */
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { restaurant_id, items, delivery_fee = 0, taxes = 0, coupon_code = null, discount = 0 } = req.body;
  let { address_id, address } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'items array is required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // If an inline address was provided, persist it first
    if (!address_id && address) {
      const a = address;
      const addrRes = await client.query(
        `INSERT INTO addresses (user_id, label, line1, line2, city, state, pincode, phone)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [req.user.id, a.label || 'Home', a.line1, a.line2 || null, a.city, a.state || null, a.pincode, a.phone || null]
      );
      address_id = addrRes.rows[0].id;
    }

    const subtotal = items.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0);
    const safeDiscount = Math.min(Number(discount) || 0, subtotal);
    const total = Math.max(subtotal + Number(delivery_fee) + Number(taxes) - safeDiscount, 0);

    const orderRes = await client.query(
      `INSERT INTO orders (user_id, restaurant_id, address_id, status, subtotal, delivery_fee, taxes, discount, coupon_code, total)
       VALUES ($1,$2,$3,'confirmed',$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.id, restaurant_id || null, address_id || null, subtotal, delivery_fee, taxes, safeDiscount, coupon_code, total]
    );
    const order = orderRes.rows[0];

    for (const it of items) {
      await client.query(
        `INSERT INTO order_items (order_id, food_item_id, name, price, quantity)
         VALUES ($1,$2,$3,$4,$5)`,
        [order.id, it.food_item_id || null, it.name, it.price, it.quantity]
      );
    }

    // Empty the server-side cart if one exists
    await client.query(
      `DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM cart WHERE user_id = $1)`,
      [req.user.id]
    );

    await client.query('COMMIT');
    res.status(201).json(order);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

/**
 * GET /api/orders
 * Customers see their own orders. Owners see every order.
 */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const isOwner = req.user.role === 'owner';
  const sql = isOwner
    ? `SELECT o.*, r.name AS restaurant_name, u.name AS customer_name
         FROM orders o
         LEFT JOIN restaurants r ON r.id = o.restaurant_id
         LEFT JOIN users u ON u.id = o.user_id
        ORDER BY o.created_at DESC`
    : `SELECT o.*, r.name AS restaurant_name
         FROM orders o
         LEFT JOIN restaurants r ON r.id = o.restaurant_id
        WHERE o.user_id = $1
        ORDER BY o.created_at DESC`;
  const params = isOwner ? [] : [req.user.id];
  const { rows } = await query(sql, params);
  res.json(rows.map((o) => ({ ...o, status: deriveLiveStatus(o) })));
}));

/**
 * GET /api/orders/:id -> order + items (+ address)
 * `status` in the response is the LIVE status (auto-advances over time).
 */
router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const orderRes = await query(
    `SELECT o.*, r.name AS restaurant_name, r.image_url AS restaurant_image
       FROM orders o
       LEFT JOIN restaurants r ON r.id = o.restaurant_id
      WHERE o.id = $1`,
    [req.params.id]
  );
  if (!orderRes.rows.length) return res.status(404).json({ message: 'Order not found.' });
  const order = orderRes.rows[0];

  // Customers may only read their own orders
  if (req.user.role !== 'owner' && order.user_id !== req.user.id) {
    return res.status(403).json({ message: 'Not allowed.' });
  }

  const itemsRes = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
  let addr = null;
  if (order.address_id) {
    const addrRes = await query('SELECT * FROM addresses WHERE id = $1', [order.address_id]);
    addr = addrRes.rows[0] || null;
  }
  res.json({ ...order, status: deriveLiveStatus(order), items: itemsRes.rows, address: addr });
}));

/**
 * GET /api/orders/:id/status -> tiny, fast payload for polling from the
 * order-tracking screen every few seconds without re-fetching everything.
 */
router.get('/:id/status', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT id, user_id, status, created_at FROM orders WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ message: 'Order not found.' });
  const order = rows[0];
  if (req.user.role !== 'owner' && order.user_id !== req.user.id) {
    return res.status(403).json({ message: 'Not allowed.' });
  }
  res.json({ id: order.id, status: deriveLiveStatus(order) });
}));

/**
 * PUT /api/orders/:id/status  { status }  (owner)
 */
router.put('/:id/status', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.role !== 'owner') return res.status(403).json({ message: 'Owner access only.' });
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  const { rows } = await query(
    'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
    [status, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Order not found.' });
  res.json(rows[0]);
}));

module.exports = router;
