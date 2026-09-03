const express = require('express');
const { query } = require('../db/pool');
const { asyncHandler } = require('../middleware/error');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function computeDiscount(coupon, subtotal) {
  let discount = coupon.discount_type === 'flat'
    ? Number(coupon.discount_value)
    : (Number(subtotal) * Number(coupon.discount_value)) / 100;

  if (coupon.max_discount != null) {
    discount = Math.min(discount, Number(coupon.max_discount));
  }
  return Math.min(Math.round(discount), Number(subtotal));
}

// POST /api/coupons/validate  { code, subtotal }
// Returns the discount amount for the given cart subtotal without charging anything.
router.post('/validate', requireAuth, asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  if (!code || subtotal == null) {
    return res.status(400).json({ message: 'code and subtotal are required.' });
  }

  const { rows } = await query(
    `SELECT * FROM coupons WHERE UPPER(code) = UPPER($1) AND is_active = true
       AND (expires_at IS NULL OR expires_at > now())`,
    [code]
  );
  if (!rows.length) {
    return res.status(404).json({ message: 'Invalid or expired coupon code.' });
  }
  const coupon = rows[0];

  if (Number(subtotal) < Number(coupon.min_order)) {
    return res.status(400).json({
      message: `Add ₹${(coupon.min_order - subtotal).toFixed(0)} more to use ${coupon.code}.`,
    });
  }

  const discount = computeDiscount(coupon, subtotal);
  res.json({
    code: coupon.code,
    description: coupon.description,
    discount,
  });
}));

// GET /api/coupons -> active coupons (shown to customers as "offers you can use")
router.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await query(
    `SELECT code, description, discount_type, discount_value, min_order, max_discount
       FROM coupons WHERE is_active = true AND (expires_at IS NULL OR expires_at > now())
      ORDER BY id`
  );
  res.json(rows);
}));

module.exports = router;
