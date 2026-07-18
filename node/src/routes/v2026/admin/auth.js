/**
 * v2026 Admin Auth Routes
 * Login via Supabase Auth
 */

const express = require('express');
const router = express.Router();
const { getSupabase } = require('../../../config/supabase');
const { v2026Response, v2026Error } = require('../../../utils/response');

/**
 * POST /api/v2026/admin/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { email, password } = req.body;

    if (!email || !password) {
      return v2026Error(res, 'email and password are required', 400);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return v2026Error(res, 'Invalid credentials', 401);
    }

    v2026Response(res, {
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * POST /api/v2026/admin/auth/logout
 */
router.post('/logout', async (req, res) => {
  try {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    v2026Response(res, { success: true });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * GET /api/v2026/admin/auth/me
 * Get current user info (requires auth)
 */
router.get('/me', async (req, res) => {
  try {
    if (!req.user) {
      return v2026Error(res, 'Unauthorized', 401);
    }

    v2026Response(res, {
      id: req.user.id,
      email: req.user.email
    });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

module.exports = router;
