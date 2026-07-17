/**
 * v2026 Admin Places CRUD
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../../../config/supabase');
const { sendV2026Success, sendV2026Error, sendV2026Paginated } = require('../../../utils/response');
const { getPagination, getOrderBy } = require('../../../utils/pagination');

/**
 * GET /api/v2026/admin/places
 * List all places with pagination
 * Query params: city_id, type (optional filters)
 */
router.get('/', async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { column, ascending } = getOrderBy(req.query, 'order');
    const { city_id, type } = req.query;

    let countQuery = supabase.from('places').select('*', { count: 'exact', head: true });
    let dataQuery = supabase.from('places').select('*');

    if (city_id) {
      countQuery = countQuery.eq('city_id', city_id);
      dataQuery = dataQuery.eq('city_id', city_id);
    }

    if (type !== undefined) {
      countQuery = countQuery.eq('type', parseInt(type));
      dataQuery = dataQuery.eq('type', parseInt(type));
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
 * GET /api/v2026/admin/places/:id
 * Get single place
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('places')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return sendV2026Error(res, 'Place not found', 404);
    }

    sendV2026Success(res, data);
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

/**
 * POST /api/v2026/admin/places
 * Create new place
 */
router.post('/', async (req, res) => {
  try {
    const {
      city_id, type, name, descr, main_photo,
      address, order, is_deleted
    } = req.body;

    const { data, error } = await supabase
      .from('places')
      .insert({
        city_id,
        type: type || 0,
        name: name || {},
        descr: descr || {},
        main_photo: main_photo || null,
        address: address || '',
        order: order || 0,
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
 * PUT /api/v2026/admin/places/:id
 * Update place
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('places')
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
 * DELETE /api/v2026/admin/places/:id
 * Soft delete place
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('places')
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
