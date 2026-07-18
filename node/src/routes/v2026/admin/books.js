/**
 * v2026 Admin Books Routes
 * CRUD for books with cascade delete
 */

const express = require('express');
const router = express.Router();
const { getSupabase } = require('../../../config/supabase');
const { v2026Response, v2026Error } = require('../../../utils/response');

/**
 * GET /api/v2026/admin/books
 * Query: ?languageId=1 (optional)
 */
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { languageId } = req.query;

    let query = supabase.from('Books').select('*').order('Id');
    if (languageId) {
      query = query.eq('LanguageId', languageId);
    }

    const { data: books, error } = await query;

    if (error) {
      return v2026Error(res, error.message, 500);
    }

    // Get language info and chapter counts
    const result = await Promise.all(books.map(async (book) => {
      const [langRes, chapRes] = await Promise.all([
        supabase.from('Languages').select('*').eq('Id', book.LanguageId).single(),
        supabase.from('Chapters').select('Id', { count: 'exact' }).eq('BookId', book.Id)
      ]);

      return {
        id: book.Id,
        languageId: book.LanguageId,
        name: book.Name,
        initials: book.Initials,
        chaptersCount: chapRes.count || 0,
        language: langRes.data ? {
          id: langRes.data.Id,
          name: langRes.data.Name,
          code: langRes.data.Code
        } : null
      };
    }));

    v2026Response(res, result);
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * GET /api/v2026/admin/books/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    const { data: book, error } = await supabase
      .from('Books')
      .select('*')
      .eq('Id', id)
      .single();

    if (error || !book) {
      return v2026Error(res, 'Book not found', 404);
    }

    const { data: lang } = await supabase
      .from('Languages')
      .select('*')
      .eq('Id', book.LanguageId)
      .single();

    v2026Response(res, {
      id: book.Id,
      languageId: book.LanguageId,
      name: book.Name,
      initials: book.Initials,
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
 * POST /api/v2026/admin/books
 */
router.post('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { languageId, name, initials } = req.body;

    if (!languageId || !name || !initials) {
      return v2026Error(res, 'languageId, name, and initials are required', 400);
    }

    // Get max ID
    const { data: maxData } = await supabase
      .from('Books')
      .select('Id')
      .order('Id', { ascending: false })
      .limit(1);

    const newId = (maxData && maxData[0] ? maxData[0].Id : 0) + 1;

    const { data, error } = await supabase
      .from('Books')
      .insert({ Id: newId, LanguageId: languageId, Name: name, Initials: initials })
      .select()
      .single();

    if (error) {
      return v2026Error(res, error.message, 500);
    }

    v2026Response(res, {
      id: data.Id,
      languageId: data.LanguageId,
      name: data.Name,
      initials: data.Initials
    });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * PUT /api/v2026/admin/books/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { languageId, name, initials } = req.body;

    const updates = {};
    if (languageId) updates.LanguageId = languageId;
    if (name) updates.Name = name;
    if (initials) updates.Initials = initials;

    if (Object.keys(updates).length === 0) {
      return v2026Error(res, 'No fields to update', 400);
    }

    const { data, error } = await supabase
      .from('Books')
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
      name: data.Name,
      initials: data.Initials
    });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * DELETE /api/v2026/admin/books/:id
 * Cascade deletes chapters, slokas, vocabularies
 */
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    // Get all chapters for this book
    const { data: chapters } = await supabase
      .from('Chapters')
      .select('Id')
      .eq('BookId', id);

    if (chapters && chapters.length > 0) {
      const chapterIds = chapters.map(c => c.Id);

      // Get all slokas for these chapters
      const { data: slokas } = await supabase
        .from('Slokas')
        .select('Id')
        .in('ChapterId', chapterIds);

      if (slokas && slokas.length > 0) {
        const slokaIds = slokas.map(s => s.Id);

        // Delete vocabularies
        await supabase.from('Vocabularies').delete().in('SlokaId', slokaIds);

        // Delete slokas
        await supabase.from('Slokas').delete().in('ChapterId', chapterIds);
      }

      // Delete chapters
      await supabase.from('Chapters').delete().eq('BookId', id);
    }

    // Delete book
    const { error } = await supabase
      .from('Books')
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
