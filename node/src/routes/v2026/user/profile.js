/**
 * v2026 User Profile
 * Authenticated user profile management
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../../../config/supabase');
const { sendV2026Success, sendV2026Error } = require('../../../utils/response');

/**
 * GET /api/v2026/user/profile
 * Get current user profile
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return sendV2026Error(res, error.message);
    }

    // If no profile exists, return basic info
    if (!profile) {
      return sendV2026Success(res, {
        id: userId,
        name: null,
        avatar: null,
        language: 'en'
      });
    }

    sendV2026Success(res, {
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar,
      language: profile.language || 'en'
    });
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

/**
 * PUT /api/v2026/user/profile
 * Update user profile
 */
router.put('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { name, avatar, language } = req.body;

    // Check if profile exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    let profile;
    let error;

    if (existing) {
      // Update existing profile
      const result = await supabase
        .from('profiles')
        .update({
          name: name !== undefined ? name : existing.name,
          avatar: avatar !== undefined ? avatar : existing.avatar,
          language: language !== undefined ? language : existing.language
        })
        .eq('id', userId)
        .select()
        .single();

      profile = result.data;
      error = result.error;
    } else {
      // Create new profile
      const result = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: name || null,
          avatar: avatar || null,
          language: language || 'en'
        })
        .select()
        .single();

      profile = result.data;
      error = result.error;
    }

    if (error) {
      return sendV2026Error(res, error.message);
    }

    sendV2026Success(res, {
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar,
      language: profile.language
    });
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

module.exports = router;
