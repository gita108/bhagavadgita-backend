/**
 * v2012 Languages Routes
 * POST /api/Data/Languages
 */

const express = require('express');
const router = express.Router();
const { getSupabase } = require('../../config/supabase');
const { transformLanguages } = require('../../transformers/v2012/languageTransformer');
const { v2012Response, v2012Error } = require('../../utils/response');

/**
 * POST /api/Data/Languages
 * Returns all available languages
 */
router.post('/Languages', async (req, res) => {
  try {
    const supabase = getSupabase();

    const { data: languages, error } = await supabase
      .from('Languages')
      .select('*')
      .order('Id');

    if (error) {
      console.error('Languages fetch error:', error);
      return v2012Error(res, error.message);
    }

    const transformed = transformLanguages(languages);
    v2012Response(res, transformed);
  } catch (err) {
    console.error('Languages exception:', err);
    v2012Error(res, 'Internal server error');
  }
});

module.exports = router;
