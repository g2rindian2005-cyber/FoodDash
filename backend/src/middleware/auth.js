/**
 * JWT auth middleware.
 *   requireAuth  -> attaches req.user = { id, role } or 401
 *   requireOwner -> must be authenticated AND role === 'owner'
 *   optionalAuth -> attaches req.user if a valid token is present, else continues
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function getToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ message: 'Authentication required.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

function requireOwner(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Owner access only.' });
    }
    next();
  });
}

function optionalAuth(req, _res, next) {
  const token = getToken(req);
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch (_) { /* ignore */ }
  }
  next();
}

module.exports = { requireAuth, requireOwner, optionalAuth, JWT_SECRET };
