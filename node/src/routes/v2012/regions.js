/**
 * v2012 Regions Routes
 * GET /api/Data/GetRegions
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../../config/supabase');
const { transformRegionsToV2012 } = require('../../transformers/v2012/regionTransformer');
const { sendV2012Success, sendV2012Error } = require('../../utils/response');

/**
 * GET /api/Data/GetRegions
 * Returns all regions (cities) for the mobile app
 */
router.get('/GetRegions', async (req, res) => {
  try {
    const lang = req.language || 'en';

    const { data: cities, error } = await supabase
      .from('cities')
      .select('*')
      .eq('is_deleted', false)
      .order('order', { ascending: true });

    if (error) {
      console.error('GetRegions error:', error);
      return sendV2012Error(res, 'Failed to fetch regions');
    }

    const regions = transformRegionsToV2012(cities || [], lang);
    sendV2012Success(res, regions);
  } catch (err) {
    console.error('GetRegions exception:', err);
    sendV2012Error(res, 'Internal server error');
  }
});

module.exports = router;
