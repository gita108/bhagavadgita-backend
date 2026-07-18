/**
 * v2026 Admin Quotes Routes
 * CRUD for quotes with set-day functionality
 */

const express = require('express');
const router = express.Router();
const { getSupabase } = require('../../../config/supabase');
const { v2026Response, v2026Error } = require('../../../utils/response');

/**
 * GET /api/v2026/admin/quotes
 * Query: ?languageId=1 (optional)
 */
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { languageId } = req.query;

    let query = supabase.from('Quotes').select('*').order('Id');
    if (languageId) {
      query = query.eq('LanguageId', languageId);
    }

    const { data: quotes, error } = await query;

    if (error) {
      return v2026Error(res, error.message, 500);
    }

    // Get language info
    const result = await Promise.all(quotes.map(async (quote) => {
      const { data: lang } = await supabase
        .from('Languages')
        .select('*')
        .eq('Id', quote.LanguageId)
        .single();

      return {
        id: quote.Id,
        languageId: quote.LanguageId,
        author: quote.Author || '',
        text: quote.Text || '',
        isDay: quote.IsDay === 1,
        language: lang ? {
          id: lang.Id,
          name: lang.Name,
          code: lang.Code
        } : null
      };
    }));

    v2026Response(res, result);
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * GET /api/v2026/admin/quotes/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    const { data: quote, error } = await supabase
      .from('Quotes')
      .select('*')
      .eq('Id', id)
      .single();

    if (error || !quote) {
      return v2026Error(res, 'Quote not found', 404);
    }

    const { data: lang } = await supabase
      .from('Languages')
      .select('*')
      .eq('Id', quote.LanguageId)
      .single();

    v2026Response(res, {
      id: quote.Id,
      languageId: quote.LanguageId,
      author: quote.Author || '',
      text: quote.Text || '',
      isDay: quote.IsDay === 1,
      language: lang ? {
        id: lang.Id,
        name: lang.Name,
        code: lang.Code
      } : null
    });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * POST /api/v2026/admin/quotes
 */
router.post('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { languageId, author, text, isDay } = req.body;

    if (!languageId || !text) {
      return v2026Error(res, 'languageId and text are required', 400);
    }

    // Get max ID
    const { data: maxData } = await supabase
      .from('Quotes')
      .select('Id')
      .order('Id', { ascending: false })
      .limit(1);

    const newId = (maxData && maxData[0] ? maxData[0].Id : 0) + 1;

    const { data, error } = await supabase
      .from('Quotes')
      .insert({
        Id: newId,
        LanguageId: languageId,
        Author: author || '',
        Text: text,
        IsDay: isDay ? 1 : 0
      })
      .select()
      .single();

    if (error) {
      return v2026Error(res, error.message, 500);
    }

    v2026Response(res, {
      id: data.Id,
      languageId: data.LanguageId,
      author: data.Author,
      text: data.Text,
      isDay: data.IsDay === 1
    });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * PUT /api/v2026/admin/quotes/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { languageId, author, text, isDay } = req.body;

    const updates = {};
    if (languageId !== undefined) updates.LanguageId = languageId;
    if (author !== undefined) updates.Author = author;
    if (text !== undefined) updates.Text = text;
    if (isDay !== undefined) updates.IsDay = isDay ? 1 : 0;

    if (Object.keys(updates).length === 0) {
      return v2026Error(res, 'No fields to update', 400);
    }

    const { data, error } = await supabase
      .from('Quotes')
      .update(updates)
      .eq('Id', id)
      .select()
      .single();

    if (error) {
      return v2026Error(res, error.message, 500);
    }

    v2026Response(res, {
      id: data.Id,
      languageId: data.LanguageId,
      author: data.Author,
      text: data.Text,
      isDay: data.IsDay === 1
    });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * PUT /api/v2026/admin/quotes/:id/set-day
 * Set this quote as "quote of the day" for its language
 */
router.put('/:id/set-day', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    // Get quote to find its language
    const { data: quote, error: fetchError } = await supabase
      .from('Quotes')
      .select('*')
      .eq('Id', id)
      .single();

    if (fetchError || !quote) {
      return v2026Error(res, 'Quote not found', 404);
    }

    // Reset isDay for all quotes in this language
    await supabase
      .from('Quotes')
      .update({ IsDay: 0 })
      .eq('LanguageId', quote.LanguageId);

    // Set this quote as day quote
    const { error } = await supabase
      .from('Quotes')
      .update({ IsDay: 1 })
      .eq('Id', id);

    if (error) {
      return v2026Error(res, error.message, 500);
    }

    v2026Response(res, { id: parseInt(id), isDay: true });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * DELETE /api/v2026/admin/quotes/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    const { error } = await supabase
      .from('Quotes')
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
