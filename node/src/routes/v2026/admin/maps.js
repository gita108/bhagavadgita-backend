/**
 * v2026 Admin Maps CRUD
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../../../config/supabase');
const { sendV2026Success, sendV2026Error, sendV2026Paginated } = require('../../../utils/response');
const { getPagination, getOrderBy } = require('../../../utils/pagination');

/**
 * GET /api/v2026/admin/maps
 * List all offline maps with pagination
 * Query params: city_id (optional filter)
 */
router.get('/', async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { column, ascending } = getOrderBy(req.query, 'id');
    const { city_id } = req.query;

    let countQuery = supabase.from('offline_maps').select('*', { count: 'exact', head: true });
    let dataQuery = supabase.from('offline_maps').select('*');

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
 * GET /api/v2026/admin/maps/:id
 * Get single map
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('offline_maps')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return sendV2026Error(res, 'Map not found', 404);
    }

    sendV2026Success(res, data);
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

/**
 * POST /api/v2026/admin/maps
 * Create new map
 */
router.post('/', async (req, res) => {
  try {
    const { city_id, file, is_deleted } = req.body;

    const { data, error } = await supabase
      .from('offline_maps')
      .insert({
        city_id,
        file: file || null,
        is_deleted: is_deleted || false
      })
      .select()
      .single();

    if (error) {
      return sendV2026Error(res, error.message);
    }

    sendV2026Success(res, data, 201);
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

/**
 * PUT /api/v2026/admin/maps/:id
 * Update map
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('offline_maps')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return sendV2026Error(res, error.message);
    }

    sendV2026Success(res, data);
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

/**
 * DELETE /api/v2026/admin/maps/:id
 * Soft delete map
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('offline_maps')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) {
      return sendV2026Error(res, error.message);
    }

    sendV2026Success(res, { deleted: true, id });
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

module.exports = router;
