/**
 * v2026 Admin Cities CRUD
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../../../config/supabase');
const { sendV2026Success, sendV2026Error, sendV2026Paginated } = require('../../../utils/response');
const { getPagination, getOrderBy } = require('../../../utils/pagination');

/**
 * GET /api/v2026/admin/cities
 * List all cities with pagination
 */
router.get('/', async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { column, ascending } = getOrderBy(req.query, 'order');

    // Get total count
    const { count } = await supabase
      .from('cities')
      .select('*', { count: 'exact', head: true });

    // Get paginated data
    const { data, error } = await supabase
      .from('cities')
      .select('*')
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
 * GET /api/v2026/admin/cities/:id
 * Get single city
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return sendV2026Error(res, 'City not found', 404);
    }

    sendV2026Success(res, data);
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

/**
 * POST /api/v2026/admin/cities
 * Create new city
 */
router.post('/', async (req, res) => {
  try {
    const { name, descr, main_photo, order, is_deleted } = req.body;

    const { data, error } = await supabase
      .from('cities')
      .insert({
        name: name || {},
        descr: descr || {},
        main_photo: main_photo || null,
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
 * PUT /api/v2026/admin/cities/:id
 * Update city
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('cities')
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
 * DELETE /api/v2026/admin/cities/:id
 * Soft delete city
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('cities')
      .update({ is_deleted: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return sendV2026Error(res, error.message);
    }

    sendV2026Success(res, { deleted: true, id });
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

module.exports = router;
