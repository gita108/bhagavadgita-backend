/**
 * v2026 Admin Languages Routes
 * CRUD for languages with books/quotes counts
 */

const express = require('express');
const router = express.Router();
const { getSupabase } = require('../../../config/supabase');
const { v2026Response, v2026Error } = require('../../../utils/response');

/**
 * GET /api/v2026/admin/languages
 * List all languages with counts
 */
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();

    const { data: languages, error } = await supabase
      .from('Languages')
      .select('*')
      .order('Id');

    if (error) {
      return v2026Error(res, error.message, 500);
    }

    // Get counts for each language
    const result = await Promise.all(languages.map(async (lang) => {
      const [booksRes, quotesRes] = await Promise.all([
        supabase.from('Books').select('Id', { count: 'exact' }).eq('LanguageId', lang.Id),
        supabase.from('Quotes').select('Id', { count: 'exact' }).eq('LanguageId', lang.Id)
      ]);

      return {
        id: lang.Id,
        name: lang.Name,
        code: lang.Code,
        booksCount: booksRes.count || 0,
        quotesCount: quotesRes.count || 0
      };
    }));

    v2026Response(res, result);
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * GET /api/v2026/admin/languages/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('Languages')
      .select('*')
      .eq('Id', id)
      .single();

    if (error || !data) {
      return v2026Error(res, 'Language not found', 404);
    }

    v2026Response(res, {
      id: data.Id,
      name: data.Name,
      code: data.Code
    });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * POST /api/v2026/admin/languages
 */
router.post('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { name, code } = req.body;

    if (!name || !code) {
      return v2026Error(res, 'name and code are required', 400);
    }

    // Get max ID
    const { data: maxData } = await supabase
      .from('Languages')
      .select('Id')
      .order('Id', { ascending: false })
      .limit(1);

    const newId = (maxData && maxData[0] ? maxData[0].Id : 0) + 1;

    const { data, error } = await supabase
      .from('Languages')
      .insert({ Id: newId, Name: name, Code: code })
      .select()
      .single();

    if (error) {
      return v2026Error(res, error.message, 500);
    }

    v2026Response(res, {
      id: data.Id,
      name: data.Name,
      code: data.Code
    });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * PUT /api/v2026/admin/languages/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { name, code } = req.body;

    const updates = {};
    if (name) updates.Name = name;
    if (code) updates.Code = code;

    if (Object.keys(updates).length === 0) {
      return v2026Error(res, 'No fields to update', 400);
    }

    const { data, error } = await supabase
      .from('Languages')
      .update(updates)
      .eq('Id', id)
      .select()
      .single();

    if (error) {
      return v2026Error(res, error.message, 500);
    }

    v2026Response(res, {
      id: data.Id,
      name: data.Name,
      code: data.Code
    });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * DELETE /api/v2026/admin/languages/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    // Check for linked books/quotes
    const [booksRes, quotesRes] = await Promise.all([
      supabase.from('Books').select('Id', { count: 'exact' }).eq('LanguageId', id),
      supabase.from('Quotes').select('Id', { count: 'exact' }).eq('LanguageId', id)
    ]);

    if ((booksRes.count || 0) > 0 || (quotesRes.count || 0) > 0) {
      return v2026Error(res, 'Cannot delete language with linked books or quotes', 400);
    }

    const { error } = await supabase
      .from('Languages')
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
