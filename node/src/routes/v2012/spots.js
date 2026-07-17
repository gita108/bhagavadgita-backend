/**
 * v2012 Spots Routes
 * GET /api/Data/GetSpots
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../../config/supabase');
const { transformSpotsToV2012 } = require('../../transformers/v2012/spotTransformer');
const { sendV2012Success, sendV2012Error } = require('../../utils/response');

/**
 * GET /api/Data/GetSpots
 * Returns spots for a specific region
 * Query params: regionId (required)
 */
router.get('/GetSpots', async (req, res) => {
  try {
    const lang = req.language || 'en';
    const { regionId } = req.query;

    if (!regionId) {
      return sendV2012Error(res, 'regionId is required');
    }

    // Fetch spots
    const { data: spots, error } = await supabase
      .from('spots')
      .select('*')
      .eq('city_id', regionId)
      .eq('is_deleted', false)
      .order('order', { ascending: true });

    if (error) {
      console.error('GetSpots error:', error);
      return sendV2012Error(res, 'Failed to fetch spots');
    }

    // Fetch photos for all spots
    const spotIds = (spots || []).map(s => s.id);
    let photosMap = {};

    if (spotIds.length > 0) {
      const { data: photos } = await supabase
        .from('spot_photos')
        .select('*')
        .in('spot_id', spotIds)
        .order('order', { ascending: true });

      if (photos) {
        photos.forEach(photo => {
          if (!photosMap[photo.spot_id]) {
            photosMap[photo.spot_id] = [];
          }
          photosMap[photo.spot_id].push(photo);
        });
      }
    }

    // Fetch audios for all spots
    let audiosMap = {};
    if (spotIds.length > 0) {
      const { data: audios } = await supabase
        .from('spot_audios')
        .select('*')
        .in('spot_id', spotIds)
        .order('order', { ascending: true });

      if (audios) {
        audios.forEach(audio => {
          if (!audiosMap[audio.spot_id]) {
            audiosMap[audio.spot_id] = [];
          }
          audiosMap[audio.spot_id].push(audio);
        });
      }
    }

    const transformedSpots = transformSpotsToV2012(spots || [], lang, photosMap, audiosMap);
    sendV2012Success(res, transformedSpots);
  } catch (err) {
    console.error('GetSpots exception:', err);
    sendV2012Error(res, 'Internal server error');
  }
});

module.exports = router;
