const express = require('express');
const { query } = require('../db/pool');
const { asyncHandler } = require('../middleware/error');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/payments
 * body: { order_id, method, amount }
 * This is a MOCK gateway — it always succeeds and records the payment.
 * Replace the body of this handler to integrate a real gateway
 * (Razorpay / Stripe). See README section "Where to change code".
 */
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { order_id, method = 'card', amount, qr_ref = null } = req.body;
  if (!order_id || amount == null) {
    return res.status(400).json({ message: 'order_id and amount are required.' });
  }
  const txnRef = 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
  const { rows } = await query(
    `INSERT INTO payments (order_id, method, amount, status, txn_ref, qr_ref)
     VALUES ($1,$2,$3,'success',$4,$5) RETURNING *`,
    [order_id, method, amount, txnRef, qr_ref]
  );
  res.status(201).json({ success: true, payment: rows[0] });
}));

/**
 * POST /api/payments/qr
 * body: { order_id, amount }
 * Generates the payload for a "Scan to Pay" UPI QR code. The frontend turns
 * this string into an actual QR image — nothing is charged by this call.
 */
router.post('/qr', requireAuth, asyncHandler(async (req, res) => {
  const { order_id, amount } = req.body;
  if (!order_id || amount == null) {
    return res.status(400).json({ message: 'order_id and amount are required.' });
  }
  const payeeVpa = process.env.UPI_MERCHANT_VPA || 'fooddash@upi';
  const payeeName = process.env.UPI_MERCHANT_NAME || 'FoodDash';
  const ref = 'QR' + order_id + '-' + Date.now();
  const upiUri =
    `upi://pay?pa=${encodeURIComponent(payeeVpa)}&pn=${encodeURIComponent(payeeName)}` +
    `&am=${encodeURIComponent(amount)}&cu=INR&tn=${encodeURIComponent('Order #' + order_id)}&tr=${ref}`;
  res.json({ upi_uri: upiUri, ref });
}));

module.exports = router;
