/**
 * v2026 Admin Chapters Routes
 * CRUD for chapters with reorder
 */

const express = require('express');
const router = express.Router();
const { getSupabase } = require('../../../config/supabase');
const { v2026Response, v2026Error } = require('../../../utils/response');

/**
 * GET /api/v2026/admin/chapters
 * Query: ?bookId=1 (required)
 */
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { bookId } = req.query;

    if (!bookId) {
      return v2026Error(res, 'bookId is required', 400);
    }

    const { data: chapters, error } = await supabase
      .from('Chapters')
      .select('*')
      .eq('BookId', bookId)
      .order('Order');

    if (error) {
      return v2026Error(res, error.message, 500);
    }

    // Get sloka counts
    const result = await Promise.all(chapters.map(async (chap) => {
      const { count } = await supabase
        .from('Slokas')
        .select('Id', { count: 'exact' })
        .eq('ChapterId', chap.Id);

      return {
        id: chap.Id,
        bookId: chap.BookId,
        name: chap.Name,
        order: chap.Order,
        slokasCount: count || 0
      };
    }));

    v2026Response(res, result);
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * GET /api/v2026/admin/chapters/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('Chapters')
      .select('*')
      .eq('Id', id)
      .single();

    if (error || !data) {
      return v2026Error(res, 'Chapter not found', 404);
    }

    v2026Response(res, {
      id: data.Id,
      bookId: data.BookId,
      name: data.Name,
      order: data.Order
    });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * POST /api/v2026/admin/chapters
 */
router.post('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { bookId, name, order } = req.body;

    if (!bookId || !name) {
      return v2026Error(res, 'bookId and name are required', 400);
    }

    // Get max ID
    const { data: maxData } = await supabase
      .from('Chapters')
      .select('Id')
      .order('Id', { ascending: false })
      .limit(1);

    const newId = (maxData && maxData[0] ? maxData[0].Id : 0) + 1;

    // Get max order if not provided
    let newOrder = order;
    if (!newOrder) {
      const { data: maxOrderData } = await supabase
        .from('Chapters')
        .select('Order')
        .eq('BookId', bookId)
        .order('Order', { ascending: false })
        .limit(1);
      newOrder = (maxOrderData && maxOrderData[0] ? maxOrderData[0].Order : 0) + 1;
    }

    const { data, error } = await supabase
      .from('Chapters')
      .insert({ Id: newId, BookId: bookId, Name: name, Order: newOrder })
      .select()
      .single();

    if (error) {
      return v2026Error(res, error.message, 500);
    }

    v2026Response(res, {
      id: data.Id,
      bookId: data.BookId,
      name: data.Name,
      order: data.Order
    });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * PUT /api/v2026/admin/chapters/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { name, order } = req.body;

    const updates = {};
    if (name) updates.Name = name;
    if (order !== undefined) updates.Order = order;

    if (Object.keys(updates).length === 0) {
      return v2026Error(res, 'No fields to update', 400);
    }

    const { data, error } = await supabase
      .from('Chapters')
      .update(updates)
      .eq('Id', id)
      .select()
      .single();

    if (error) {
      return v2026Error(res, error.message, 500);
    }

    v2026Response(res, {
      id: data.Id,
      bookId: data.BookId,
      name: data.Name,
      order: data.Order
    });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * PUT /api/v2026/admin/chapters/reorder
 * Body: { bookId, order: [chapterId1, chapterId2, ...] }
 */
router.put('/reorder', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { bookId, order } = req.body;

    if (!bookId || !order || !Array.isArray(order)) {
      return v2026Error(res, 'bookId and order array are required', 400);
    }

    // Update order for each chapter
    let updated = 0;
    for (let i = 0; i < order.length; i++) {
      const { error } = await supabase
        .from('Chapters')
        .update({ Order: i + 1 })
        .eq('Id', order[i])
        .eq('BookId', bookId);

      if (!error) updated++;
    }

    v2026Response(res, { updated });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * DELETE /api/v2026/admin/chapters/:id
 * Cascade deletes slokas and vocabularies
 */
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    // Get slokas for this chapter
    const { data: slokas } = await supabase
      .from('Slokas')
      .select('Id')
      .eq('ChapterId', id);

    if (slokas && slokas.length > 0) {
      const slokaIds = slokas.map(s => s.Id);

      // Delete vocabularies
      await supabase.from('Vocabularies').delete().in('SlokaId', slokaIds);

      // Delete slokas
      await supabase.from('Slokas').delete().eq('ChapterId', id);
    }

    // Delete chapter
    const { error } = await supabase
      .from('Chapters')
      .delete()
      .eq('Id', id);

    if (error) {
      return v2026Error(res, error.message, 500);
    }

    v2026Response(res, { deleted: true });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

module.exports = router;
