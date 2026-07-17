/**
 * v2012 Chapters Routes
 * POST /api/Data/Chapters
 */

const express = require('express');
const router = express.Router();
const { getSupabase } = require('../../config/supabase');
const { transformChapters } = require('../../transformers/v2012/chapterTransformer');
const { v2012Response, v2012Error } = require('../../utils/response');

/**
 * POST /api/Data/Chapters
 * Body: { bookId: 1 } - required
 * Returns chapters with nested slokas and vocabularies
 */
router.post('/Chapters', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { bookId } = req.body || {};

    if (!bookId) {
      return v2012Error(res, 'bookId is required');
    }

    // 1. Fetch chapters for the book
    const { data: chapters, error: chapError } = await supabase
      .from('Chapters')
      .select('*')
      .eq('BookId', bookId)
      .order('Order');

    if (chapError) {
      console.error('Chapters fetch error:', chapError);
      return v2012Error(res, chapError.message);
    }

    if (!chapters || chapters.length === 0) {
      return v2012Response(res, []);
    }

    // 2. Fetch all slokas for these chapters
    const chapterIds = chapters.map(c => c.Id);
    const { data: slokas, error: slokaError } = await supabase
      .from('Slokas')
      .select('*')
      .in('ChapterId', chapterIds)
      .order('Order');

    if (slokaError) {
      console.error('Slokas fetch error:', slokaError);
      return v2012Error(res, slokaError.message);
    }

    // 3. Fetch all vocabularies for these slokas
    const slokaIds = (slokas || []).map(s => s.Id);
    let vocabulariesMap = {};

    if (slokaIds.length > 0) {
      const { data: vocabularies, error: vocabError } = await supabase
        .from('Vocabularies')
        .select('*')
        .in('SlokaId', slokaIds);

      if (vocabError) {
        console.error('Vocabularies fetch error:', vocabError);
        // Continue without vocabularies rather than failing
      } else {
        // Group vocabularies by SlokaId
        (vocabularies || []).forEach(v => {
          if (!vocabulariesMap[v.SlokaId]) {
            vocabulariesMap[v.SlokaId] = [];
          }
          vocabulariesMap[v.SlokaId].push(v);
        });
      }
    }

    // 4. Group slokas by ChapterId
    const slokasMap = {};
    (slokas || []).forEach(s => {
      if (!slokasMap[s.ChapterId]) {
        slokasMap[s.ChapterId] = [];
      }
      slokasMap[s.ChapterId].push(s);
    });

    // 5. Transform and respond
    const transformed = transformChapters(chapters, slokasMap, vocabulariesMap);
    v2012Response(res, transformed);
  } catch (err) {
    console.error('Chapters exception:', err);
    v2012Error(res, 'Internal server error');
  }
});

module.exports = router;
