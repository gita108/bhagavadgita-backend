/**
 * v2012 Directions Routes
 * GET /api/Data/GetDirections
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../../config/supabase');
const { transformDirectionsToV2012 } = require('../../transformers/v2012/directionTransformer');
const { sendV2012Success, sendV2012Error } = require('../../utils/response');

/**
 * GET /api/Data/GetDirections
 * Returns directions for a specific region
 * Query params: regionId (required)
 */
router.get('/GetDirections', async (req, res) => {
  try {
    const lang = req.language || 'en';
    const { regionId } = req.query;

    if (!regionId) {
      return sendV2012Error(res, 'regionId is required');
    }

    const { data: directions, error } = await supabase
      .from('directions')
      .select('*')
      .eq('city_id', regionId)
      .eq('is_deleted', false)
      .order('order', { ascending: true });

    if (error) {
      console.error('GetDirections error:', error);
      return sendV2012Error(res, 'Failed to fetch directions');
    }

    const transformedDirections = transformDirectionsToV2012(directions || [], lang);
    sendV2012Success(res, transformedDirections);
  } catch (err) {
    console.error('GetDirections exception:', err);
    sendV2012Error(res, 'Internal server error');
  }
});

module.exports = router;
