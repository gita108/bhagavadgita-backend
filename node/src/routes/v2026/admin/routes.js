/**
 * v2026 Admin Routes (Guides) CRUD
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../../../config/supabase');
const { sendV2026Success, sendV2026Error, sendV2026Paginated } = require('../../../utils/response');
const { getPagination, getOrderBy } = require('../../../utils/pagination');

/**
 * GET /api/v2026/admin/routes
 * List all routes with pagination
 * Query params: city_id (optional filter)
 */
router.get('/', async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { column, ascending } = getOrderBy(req.query, 'order');
    const { city_id } = req.query;

    let countQuery = supabase.from('routes').select('*', { count: 'exact', head: true });
    let dataQuery = supabase.from('routes').select('*');

    if (city_id) {
      countQuery = countQuery.eq('city_id', city_id);
      dataQuery = dataQuery.eq('city_id', city_id);
    }

    const { count } = await countQuery;
    const { data, error } = await dataQuery
      .order(column, { ascending })
      .range(offset, offset + limit - 1);

    if (error) {
      return sendV2026Error(res, error.message);
    }

    sendV2026Paginated(res, data, { page, limit, total: count || 0 });
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

/**
 * GET /api/v2026/admin/routes/:id
 * Get single route with spots
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: route, error } = await supabase
      .from('routes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return sendV2026Error(res, 'Route not found', 404);
    }

    // Fetch route spots
    const { data: routeSpots } = await supabase
      .from('route_spots')
      .select('spot_id, order')
      .eq('route_id', id)
      .order('order', { ascending: true });

    sendV2026Success(res, {
      ...route,
      spot_ids: (routeSpots || []).map(rs => rs.spot_id)
    });
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

/**
 * POST /api/v2026/admin/routes
 * Create new route
 */
router.post('/', async (req, res) => {
  try {
    const {
      city_id, parent_id, name, info, images,
      order, is_deleted, spot_ids
    } = req.body;

    const { data: route, error } = await supabase
      .from('routes')
      .insert({
        city_id,
        parent_id: parent_id || null,
        name: name || {},
        info: info || {},
        images: images || [],
        order: order || 0,
        is_deleted: is_deleted || false
      })
      .select()
      .single();

    if (error) {
      return sendV2026Error(res, error.message);
    }

    // Insert route_spots if provided
    if (spot_ids && Array.isArray(spot_ids)) {
      for (let i = 0; i < spot_ids.length; i++) {
        await supabase.from('route_spots').insert({
          route_id: route.id,
          spot_id: spot_ids[i],
          order: i
        });
      }
    }

    sendV2026Success(res, route, 201);
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

/**
 * PUT /api/v2026/admin/routes/:id
 * Update route
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { spot_ids, ...updates } = req.body;

    const { data: route, error } = await supabase
      .from('routes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return sendV2026Error(res, error.message);
    }

    // Update route_spots if provided
    if (spot_ids && Array.isArray(spot_ids)) {
      await supabase.from('route_spots').delete().eq('route_id', id);
      for (let i = 0; i < spot_ids.length; i++) {
        await supabase.from('route_spots').insert({
          route_id: id,
          spot_id: spot_ids[i],
          order: i
        });
      }
    }

    sendV2026Success(res, route);
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

/**
 * DELETE /api/v2026/admin/routes/:id
 * Soft delete route
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('routes')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) {
      return sendV2026Error(res, error.message);
    }

    // Also delete route_spots
    await supabase.from('route_spots').delete().eq('route_id', id);

    sendV2026Success(res, { deleted: true, id });
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

module.exports = router;
