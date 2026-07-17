/**
 * v2012 Quotes Routes
 * POST /api/Data/Quotes
 */

const express = require('express');
const router = express.Router();
const { getSupabase } = require('../../config/supabase');
const { transformQuote } = require('../../transformers/v2012/quoteTransformer');
const { V2012_CODES, v2012Error } = require('../../utils/response');

/**
 * POST /api/Data/Quotes
 * Returns random quote (filtered by Accept-Language header if possible)
 * Note: Returns single object in data, not array
 */
router.post('/Quotes', async (req, res) => {
  try {
    const supabase = getSupabase();
    const lang = req.language || 'en';

    // Try to get language ID for filtering
    const { data: langData } = await supabase
      .from('Languages')
      .select('Id')
      .eq('Code', lang)
      .single();

    // Build query - filter by language if found
    let query = supabase.from('Quotes').select('*');

    if (langData && langData.Id) {
      query = query.eq('LanguageId', langData.Id);
    }

    const { data: quotes, error } = await query;

    if (error) {
      console.error('Quotes fetch error:', error);
      return v2012Error(res, error.message);
    }

    // If no quotes for this language, get any quote
    if (!quotes || quotes.length === 0) {
      const { data: anyQuotes } = await supabase
        .from('Quotes')
        .select('*')
        .limit(10);

      if (!anyQuotes || anyQuotes.length === 0) {
        return v2012Error(res, 'No quotes found');
      }

      // Random selection
      const randomQuote = anyQuotes[Math.floor(Math.random() * anyQuotes.length)];

      // Return single object (not array) for Quote endpoint
      return res.json({
        code: V2012_CODES.SUCCESS,
        msg: '',
        data: transformQuote(randomQuote)
      });
    }

    // Random selection from language-filtered quotes
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    // Return single object (not array) for Quote endpoint
    res.json({
      code: V2012_CODES.SUCCESS,
      msg: '',
      data: transformQuote(randomQuote)
    });
  } catch (err) {
    console.error('Quotes exception:', err);
    v2012Error(res, 'Internal server error');
  }
});

module.exports = router;
