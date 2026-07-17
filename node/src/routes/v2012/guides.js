/**
 * v2012 Guides Routes
 * GET /api/Data/GetGuides
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../../config/supabase');
const { transformRoutesToGuides } = require('../../transformers/v2012/guideTransformer');
const { sendV2012Success, sendV2012Error } = require('../../utils/response');

/**
 * GET /api/Data/GetGuides
 * Returns guides (routes) for a specific region
 * Query params: regionId (required)
 */
router.get('/GetGuides', async (req, res) => {
  try {
    const lang = req.language || 'en';
    const { regionId } = req.query;

    if (!regionId) {
      return sendV2012Error(res, 'regionId is required');
    }

    // Fetch routes for the region
    const { data: routes, error } = await supabase
      .from('routes')
      .select('*')
      .eq('city_id', regionId)
      .eq('is_deleted', false)
      .order('order', { ascending: true });

    if (error) {
      console.error('GetGuides error:', error);
      return sendV2012Error(res, 'Failed to fetch guides');
    }

    // Fetch route_spots to get spot IDs for each route
    const routeIds = (routes || []).map(r => r.id);
    let spotsMap = {};

    if (routeIds.length > 0) {
      const { data: routeSpots } = await supabase
        .from('route_spots')
        .select('route_id, spot_id')
        .in('route_id', routeIds)
        .order('order', { ascending: true });

      if (routeSpots) {
        routeSpots.forEach(rs => {
          if (!spotsMap[rs.route_id]) {
            spotsMap[rs.route_id] = [];
          }
          spotsMap[rs.route_id].push(rs.spot_id);
        });
      }
    }

    const guides = transformRoutesToGuides(routes || [], lang, spotsMap);
    sendV2012Success(res, guides);
  } catch (err) {
    console.error('GetGuides exception:', err);
    sendV2012Error(res, 'Internal server error');
  }
});

module.exports = router;
