/**
 * v2012 Maps Routes
 * GET /api/Data/GetMaps
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../../config/supabase');
const { transformMapsToV2012 } = require('../../transformers/v2012/mapTransformer');
const { sendV2012Success, sendV2012Error } = require('../../utils/response');

/**
 * GET /api/Data/GetMaps
 * Returns offline maps for a specific region
 * Query params: regionId (required)
 */
router.get('/GetMaps', async (req, res) => {
  try {
    const { regionId } = req.query;

    if (!regionId) {
      return sendV2012Error(res, 'regionId is required');
    }

    const { data: maps, error } = await supabase
      .from('offline_maps')
      .select('*')
      .eq('city_id', regionId)
      .eq('is_deleted', false);

    if (error) {
      console.error('GetMaps error:', error);
      return sendV2012Error(res, 'Failed to fetch maps');
    }

    const transformedMaps = transformMapsToV2012(maps || []);
    sendV2012Success(res, transformedMaps);
  } catch (err) {
    console.error('GetMaps exception:', err);
    sendV2012Error(res, 'Internal server error');
  }
});

module.exports = router;
