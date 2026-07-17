/**
 * Global error handler
 * Detects API version from URL and returns appropriate format
 */
function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err.message);
  console.error(err.stack);

  const isV2012 = req.path.startsWith('/api/Data') || req.path.startsWith('/api/data');

  if (isV2012) {
    // v2012 format
    return res.status(200).json({
      code: 1,
      msg: err.message || 'Internal server error',
      data: []
    });
  }

  // v2026 format
  const status = err.status || 500;
  return res.status(status).json({
    success: false,
    error: err.message || 'Internal server error',
    data: null
  });
}

module.exports = { errorHandler };
