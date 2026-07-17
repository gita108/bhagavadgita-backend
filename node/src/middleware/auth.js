const { getSupabase } = require('../config/supabase');

/**
 * Auth middleware for v2026 user endpoints
 * Verifies Supabase JWT token
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header required',
        data: null
      });
    }

    const token = authHeader.substring(7);
    const supabase = getSupabase();

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        data: null
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      data: null
    });
  }
}

module.exports = { authMiddleware };
