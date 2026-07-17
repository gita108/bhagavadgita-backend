/**
 * v2026 User Favorites
 * Manage user's favorite spots
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../../../config/supabase');
const { sendV2026Success, sendV2026Error, sendV2026Paginated } = require('../../../utils/response');
const { getPagination } = require('../../../utils/pagination');

/**
 * GET /api/v2026/user/favorites
 * Get user's favorite spots
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const lang = req.language || 'en';
    const { page, limit, offset } = getPagination(req.query);

    const { count } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { data: favorites, error } = await supabase
      .from('favorites')
      .select('spot_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return sendV2026Error(res, error.message);
    }

    // Fetch spot details
    const spotIds = (favorites || []).map(f => f.spot_id);
    let spots = [];

    if (spotIds.length > 0) {
      const { data: spotsData } = await supabase
        .from('spots')
        .select('*')
        .in('id', spotIds)
        .eq('is_deleted', false);

      if (spotsData) {
        const spotMap = {};
        spotsData.forEach(s => { spotMap[s.id] = s; });

        spots = spotIds
          .filter(id => spotMap[id])
          .map(id => {
            const spot = spotMap[id];
            const fav = favorites.find(f => f.spot_id === id);
            return {
              id: spot.id,
              name: getLocalizedValue(spot.name, lang),
              mainPhoto: spot.main_photo,
              addedAt: fav?.created_at
            };
          });
      }
    }

    sendV2026Paginated(res, spots, { page, limit, total: count || 0 });
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

/**
 * POST /api/v2026/user/favorites
 * Add spot to favorites
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { spot_id } = req.body;

    if (!spot_id) {
      return sendV2026Error(res, 'spot_id is required', 400);
    }

    // Check if spot exists
    const { data: spot } = await supabase
      .from('spots')
      .select('id')
      .eq('id', spot_id)
      .eq('is_deleted', false)
      .single();

    if (!spot) {
      return sendV2026Error(res, 'Spot not found', 404);
    }

    // Check if already favorited
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('spot_id', spot_id)
      .single();

    if (existing) {
      return sendV2026Success(res, { favorited: true, spot_id });
    }

    // Add to favorites
    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        spot_id: spot_id
      });

    if (error) {
      return sendV2026Error(res, error.message);
    }

    sendV2026Success(res, { favorited: true, spot_id }, 201);
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

/**
 * DELETE /api/v2026/user/favorites/:spotId
 * Remove spot from favorites
 */
router.delete('/:spotId', async (req, res) => {
  try {
    const userId = req.userId;
    const { spotId } = req.params;

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('spot_id', spotId);

    if (error) {
      return sendV2026Error(res, error.message);
    }

    sendV2026Success(res, { favorited: false, spot_id: spotId });
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

/**
 * GET /api/v2026/user/favorites/check/:spotId
 * Check if spot is favorited
 */
router.get('/check/:spotId', async (req, res) => {
  try {
    const userId = req.userId;
    const { spotId } = req.params;

    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('spot_id', spotId)
      .single();

    sendV2026Success(res, { favorited: !!data, spot_id: spotId });
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

function getLocalizedValue(jsonb, lang) {
  if (!jsonb) return '';
  if (typeof jsonb === 'string') {
    try {
      jsonb = JSON.parse(jsonb);
    } catch {
      return jsonb;
    }
  }
  return jsonb[lang] || jsonb.en || jsonb.ru || '';
}

module.exports = router;
