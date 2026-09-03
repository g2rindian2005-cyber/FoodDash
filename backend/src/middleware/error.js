/**
 * Centralised error handling.
 *   asyncHandler -> wraps async route handlers so thrown errors reach errorHandler
 *   notFound     -> 404 for unmatched routes
 *   errorHandler -> final JSON error responder
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const notFound = (req, res) =>
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error('API error:', err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal server error.',
  });
};

module.exports = { asyncHandler, notFound, errorHandler };
