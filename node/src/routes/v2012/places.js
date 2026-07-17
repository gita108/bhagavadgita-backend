/**
 * v2012 Places Routes
 * GET /api/Data/GetPlaces
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../../config/supabase');
const { transformPlacesToV2012 } = require('../../transformers/v2012/placeTransformer');
const { sendV2012Success, sendV2012Error } = require('../../utils/response');

/**
 * GET /api/Data/GetPlaces
 * Returns places (hotels, food) for a specific region
 * Query params: regionId (required), type (optional: 0=hotel, 1=food)
 */
router.get('/GetPlaces', async (req, res) => {
  try {
    const lang = req.language || 'en';
    const { regionId, type } = req.query;

    if (!regionId) {
      return sendV2012Error(res, 'regionId is required');
    }

    let query = supabase
      .from('places')
      .select('*')
      .eq('city_id', regionId)
      .eq('is_deleted', false)
      .order('order', { ascending: true });

    // Filter by type if specified
    if (type !== undefined) {
      query = query.eq('type', parseInt(type));
    }

    const { data: places, error } = await query;

    if (error) {
      console.error('GetPlaces error:', error);
      return sendV2012Error(res, 'Failed to fetch places');
    }

    const transformedPlaces = transformPlacesToV2012(places || [], lang);
    sendV2012Success(res, transformedPlaces);
  } catch (err) {
    console.error('GetPlaces exception:', err);
    sendV2012Error(res, 'Internal server error');
  }
});

module.exports = router;
