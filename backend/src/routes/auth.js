const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db/pool');
const { asyncHandler } = require('../middleware/error');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const publicUser = (u) => ({
  id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role,
});

// POST /api/auth/register
router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email and password are required.' });
  }
  const exists = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (exists.rows.length) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }
  const hash = await bcrypt.hash(password, 10);
  const safeRole = role === 'owner' ? 'owner' : 'customer';
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, phone, role)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id, name, email, phone, role`,
    [name, email.toLowerCase(), hash, phone || null, safeRole]
  );
  const user = rows[0];
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required.' });
  }
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  const user = rows[0];
  if (!user) return res.status(401).json({ message: 'Invalid email or password.' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: 'Invalid email or password.' });
  res.json({ token: signToken(user), user: publicUser(user) });
}));

// GET /api/auth/me
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await query(
    'SELECT id, name, email, phone, role FROM users WHERE id = $1',
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'User not found.' });
  res.json({ user: rows[0] });
}));

module.exports = router;
