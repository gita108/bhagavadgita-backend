/**
 * v2012 Books Routes
 * POST /api/Data/Books
 */

const express = require('express');
const router = express.Router();
const { getSupabase } = require('../../config/supabase');
const { transformBooks } = require('../../transformers/v2012/bookTransformer');
const { v2012Response, v2012Error } = require('../../utils/response');

/**
 * POST /api/Data/Books
 * Body: { ids: [1, 2, ...] } - optional, if empty/missing returns all books
 * Returns books with chaptersCount
 */
router.post('/Books', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { ids } = req.body || {};

    // Build query
    let query = supabase.from('Books').select('*');

    // Filter by ids if provided
    if (ids && Array.isArray(ids) && ids.length > 0) {
      query = query.in('Id', ids);
    }

    const { data: books, error } = await query.order('Id');

    if (error) {
      console.error('Books fetch error:', error);
      return v2012Error(res, error.message);
    }

    if (!books || books.length === 0) {
      return v2012Response(res, []);
    }

    // Get chapters count per book
    const bookIds = books.map(b => b.Id);
    const { data: chapters } = await supabase
      .from('Chapters')
      .select('BookId')
      .in('BookId', bookIds);

    // Build count map
    const countMap = {};
    (chapters || []).forEach(c => {
      countMap[c.BookId] = (countMap[c.BookId] || 0) + 1;
    });

    const transformed = transformBooks(books, countMap);
    v2012Response(res, transformed);
  } catch (err) {
    console.error('Books exception:', err);
    v2012Error(res, 'Internal server error');
  }
});

module.exports = router;
