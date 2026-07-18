/**
 * v2026 Admin Devices Routes
 * List devices and statistics
 */

const express = require('express');
const router = express.Router();
const { getSupabase } = require('../../../config/supabase');
const { v2026Response, v2026Error } = require('../../../utils/response');

const PLATFORMS = {
  0: 'android',
  1: 'ios',
  2: 'windows'
};

/**
 * GET /api/v2026/admin/devices
 * Query: ?platform=ios|android|windows (optional), ?page=1&limit=50
 */
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { platform, page = 1, limit = 50 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let countQuery = supabase.from('Devices').select('Id', { count: 'exact' });
    let dataQuery = supabase.from('Devices').select('*').order('LastModified', { ascending: false });

    // Filter by platform
    if (platform) {
      const platformCode = Object.keys(PLATFORMS).find(k => PLATFORMS[k] === platform.toLowerCase());
      if (platformCode !== undefined) {
        countQuery = countQuery.eq('Platform', parseInt(platformCode));
        dataQuery = dataQuery.eq('Platform', parseInt(platformCode));
      }
    }

    // Get count
    const { count } = await countQuery;

    // Get data with pagination
    const { data: devices, error } = await dataQuery.range(offset, offset + parseInt(limit) - 1);

    if (error) {
      return v2026Error(res, error.message, 500);
    }

    const result = devices.map(d => ({
      id: d.Id,
      platform: d.Platform,
      platformName: PLATFORMS[d.Platform] || 'unknown',
      culture: d.Culture,
      lastModified: d.LastModified,
      pushToken: d.PushToken ? d.PushToken.substring(0, 4) + '...' + d.PushToken.slice(-4) : null,
      appVersion: d.AppVersion,
      model: d.Model
    }));

    v2026Response(res, result, {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count || 0
    });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * GET /api/v2026/admin/devices/stats
 * Device statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const supabase = getSupabase();

    // Total count
    const { count: total } = await supabase
      .from('Devices')
      .select('Id', { count: 'exact' });

    // Active in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: active30days } = await supabase
      .from('Devices')
      .select('Id', { count: 'exact' })
      .gte('LastModified', thirtyDaysAgo.toISOString());

    // By platform
    const { data: platformData } = await supabase
      .from('Devices')
      .select('Platform');

    const byPlatform = {
      android: 0,
      ios: 0,
      windows: 0
    };

    if (platformData) {
      platformData.forEach(d => {
        const platformName = PLATFORMS[d.Platform];
        if (platformName && byPlatform[platformName] !== undefined) {
          byPlatform[platformName]++;
        }
      });
    }

    v2026Response(res, {
      total: total || 0,
      active30days: active30days || 0,
      byPlatform
    });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

module.exports = router;
