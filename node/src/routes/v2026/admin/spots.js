/**
 * v2026 Admin Spots CRUD
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../../../config/supabase');
const { sendV2026Success, sendV2026Error, sendV2026Paginated } = require('../../../utils/response');
const { getPagination, getOrderBy } = require('../../../utils/pagination');

/**
 * GET /api/v2026/admin/spots
 * List all spots with pagination
 * Query params: city_id (optional filter)
 */
router.get('/', async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { column, ascending } = getOrderBy(req.query, 'order');
    const { city_id } = req.query;

    let countQuery = supabase.from('spots').select('*', { count: 'exact', head: true });
    let dataQuery = supabase.from('spots').select('*');

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
 * GET /api/v2026/admin/spots/:id
 * Get single spot with photos and audios
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: spot, error } = await supabase
      .from('spots')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return sendV2026Error(res, 'Spot not found', 404);
    }

    // Fetch photos
    const { data: photos } = await supabase
      .from('spot_photos')
      .select('*')
      .eq('spot_id', id)
      .order('order', { ascending: true });

    // Fetch audios
    const { data: audios } = await supabase
      .from('spot_audios')
      .select('*')
      .eq('spot_id', id)
      .order('order', { ascending: true });

    sendV2026Success(res, {
      ...spot,
      photos: photos || [],
      audios: audios || []
    });
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

/**
 * POST /api/v2026/admin/spots
 * Create new spot
 */
router.post('/', async (req, res) => {
  try {
    const {
      city_id, name, descr, main_photo, location,
      address, order, is_deleted, photos, audios
    } = req.body;

    const { data: spot, error } = await supabase
      .from('spots')
      .insert({
        city_id,
        name: name || {},
        descr: descr || {},
        main_photo: main_photo || null,
        location: location || null,
        address: address || null,
        order: order || 0,
        is_deleted: is_deleted || false
      })
      .select()
      .single();

    if (error) {
      return sendV2026Error(res, error.message);
    }

    // Insert photos if provided
    if (photos && Array.isArray(photos)) {
      for (let i = 0; i < photos.length; i++) {
        await supabase.from('spot_photos').insert({
          spot_id: spot.id,
          photo: photos[i],
          order: i
        });
      }
    }

    // Insert audios if provided
    if (audios && Array.isArray(audios)) {
      for (let i = 0; i < audios.length; i++) {
        await supabase.from('spot_audios').insert({
          spot_id: spot.id,
          ...audios[i],
          order: i
        });
      }
    }

    sendV2026Success(res, spot, 201);
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

/**
 * PUT /api/v2026/admin/spots/:id
 * Update spot
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { photos, audios, ...updates } = req.body;

    const { data: spot, error } = await supabase
      .from('spots')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return sendV2026Error(res, error.message);
    }

    // Update photos if provided
    if (photos && Array.isArray(photos)) {
      await supabase.from('spot_photos').delete().eq('spot_id', id);
      for (let i = 0; i < photos.length; i++) {
        await supabase.from('spot_photos').insert({
          spot_id: id,
          photo: typeof photos[i] === 'string' ? photos[i] : photos[i].photo,
          order: i
        });
      }
    }

    // Update audios if provided
    if (audios && Array.isArray(audios)) {
      await supabase.from('spot_audios').delete().eq('spot_id', id);
      for (let i = 0; i < audios.length; i++) {
        await supabase.from('spot_audios').insert({
          spot_id: id,
          ...audios[i],
          order: i
        });
      }
    }

    sendV2026Success(res, spot);
  } catch (err) {
    sendV2026Error(res, err.message, 500);
  }
});

/**
 * DELETE /api/v2026/admin/spots/:id
 * Soft delete spot
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('spots')
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
