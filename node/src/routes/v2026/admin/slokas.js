/**
 * v2026 Admin Slokas Routes
 * CRUD for slokas with vocabularies and reorder
 */

const express = require('express');
const router = express.Router();
const { getSupabase } = require('../../../config/supabase');
const { v2026Response, v2026Error } = require('../../../utils/response');

/**
 * GET /api/v2026/admin/slokas
 * Query: ?chapterId=1 (required), ?page=1&limit=20 (optional)
 */
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { chapterId, page = 1, limit = 20 } = req.query;

    if (!chapterId) {
      return v2026Error(res, 'chapterId is required', 400);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const { count } = await supabase
      .from('Slokas')
      .select('Id', { count: 'exact' })
      .eq('ChapterId', chapterId);

    // Get slokas with pagination
    const { data: slokas, error } = await supabase
      .from('Slokas')
      .select('*')
      .eq('ChapterId', chapterId)
      .order('Order')
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      return v2026Error(res, error.message, 500);
    }

    const result = slokas.map(s => ({
      id: s.Id,
      chapterId: s.ChapterId,
      name: s.Name,
      translation: s.Translation ? s.Translation.substring(0, 100) + '...' : '',
      order: s.Order,
      hasAudio: !!s.Audio,
      hasAudioSanskrit: !!s.AudioSanskrit
    }));

    v2026Response(res, result, {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count || 0
    });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * GET /api/v2026/admin/slokas/:id
 * Returns full sloka with vocabularies
 */
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    const { data: sloka, error } = await supabase
      .from('Slokas')
      .select('*')
      .eq('Id', id)
      .single();

    if (error || !sloka) {
      return v2026Error(res, 'Sloka not found', 404);
    }

    // Get vocabularies
    const { data: vocabularies } = await supabase
      .from('Vocabularies')
      .select('*')
      .eq('SlokaId', id);

    v2026Response(res, {
      id: sloka.Id,
      chapterId: sloka.ChapterId,
      name: sloka.Name,
      text: sloka.Text || '',
      transcription: sloka.Transcription || '',
      translation: sloka.Translation || '',
      comment: sloka.Comment || '',
      order: sloka.Order,
      audio: sloka.Audio || '',
      audioSanskrit: sloka.AudioSanskrit || '',
      vocabularies: (vocabularies || []).map(v => ({
        id: v.Id,
        text: v.Text,
        translation: v.Translation
      }))
    });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * POST /api/v2026/admin/slokas
 */
router.post('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { chapterId, name, text, transcription, translation, comment, order, audio, audioSanskrit, vocabularies } = req.body;

    if (!chapterId || !name) {
      return v2026Error(res, 'chapterId and name are required', 400);
    }

    // Get max ID
    const { data: maxData } = await supabase
      .from('Slokas')
      .select('Id')
      .order('Id', { ascending: false })
      .limit(1);

    const newId = (maxData && maxData[0] ? maxData[0].Id : 0) + 1;

    // Get max order if not provided
    let newOrder = order;
    if (!newOrder) {
      const { data: maxOrderData } = await supabase
        .from('Slokas')
        .select('Order')
        .eq('ChapterId', chapterId)
        .order('Order', { ascending: false })
        .limit(1);
      newOrder = (maxOrderData && maxOrderData[0] ? maxOrderData[0].Order : 0) + 1;
    }

    const { data: sloka, error } = await supabase
      .from('Slokas')
      .insert({
        Id: newId,
        ChapterId: chapterId,
        Name: name,
        Text: text || '',
        Transcription: transcription || '',
        Translation: translation || '',
        Comment: comment || '',
        Order: newOrder,
        Audio: audio || '',
        AudioSanskrit: audioSanskrit || ''
      })
      .select()
      .single();

    if (error) {
      return v2026Error(res, error.message, 500);
    }

    // Insert vocabularies if provided
    if (vocabularies && vocabularies.length > 0) {
      const { data: maxVocabData } = await supabase
        .from('Vocabularies')
        .select('Id')
        .order('Id', { ascending: false })
        .limit(1);

      let vocabId = (maxVocabData && maxVocabData[0] ? maxVocabData[0].Id : 0) + 1;

      const vocabInserts = vocabularies.map(v => ({
        Id: vocabId++,
        SlokaId: sloka.Id,
        Text: v.text,
        Translation: v.translation
      }));

      await supabase.from('Vocabularies').insert(vocabInserts);
    }

    v2026Response(res, {
      id: sloka.Id,
      chapterId: sloka.ChapterId,
      name: sloka.Name,
      order: sloka.Order
    });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * PUT /api/v2026/admin/slokas/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { name, text, transcription, translation, comment, order, audio, audioSanskrit, vocabularies } = req.body;

    const updates = {};
    if (name !== undefined) updates.Name = name;
    if (text !== undefined) updates.Text = text;
    if (transcription !== undefined) updates.Transcription = transcription;
    if (translation !== undefined) updates.Translation = translation;
    if (comment !== undefined) updates.Comment = comment;
    if (order !== undefined) updates.Order = order;
    if (audio !== undefined) updates.Audio = audio;
    if (audioSanskrit !== undefined) updates.AudioSanskrit = audioSanskrit;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('Slokas')
        .update(updates)
        .eq('Id', id);

      if (error) {
        return v2026Error(res, error.message, 500);
      }
    }

    // Update vocabularies if provided (replace all)
    if (vocabularies !== undefined) {
      // Delete existing
      await supabase.from('Vocabularies').delete().eq('SlokaId', id);

      // Insert new
      if (vocabularies.length > 0) {
        const { data: maxVocabData } = await supabase
          .from('Vocabularies')
          .select('Id')
          .order('Id', { ascending: false })
          .limit(1);

        let vocabId = (maxVocabData && maxVocabData[0] ? maxVocabData[0].Id : 0) + 1;

        const vocabInserts = vocabularies.map(v => ({
          Id: vocabId++,
          SlokaId: parseInt(id),
          Text: v.text,
          Translation: v.translation
        }));

        await supabase.from('Vocabularies').insert(vocabInserts);
      }
    }

    // Get updated sloka
    const { data: sloka } = await supabase
      .from('Slokas')
      .select('*')
      .eq('Id', id)
      .single();

    v2026Response(res, {
      id: sloka.Id,
      chapterId: sloka.ChapterId,
      name: sloka.Name,
      order: sloka.Order
    });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * PUT /api/v2026/admin/slokas/reorder
 * Body: { chapterId, order: [slokaId1, slokaId2, ...] }
 */
router.put('/reorder', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { chapterId, order } = req.body;

    if (!chapterId || !order || !Array.isArray(order)) {
      return v2026Error(res, 'chapterId and order array are required', 400);
    }

    let updated = 0;
    for (let i = 0; i < order.length; i++) {
      const { error } = await supabase
        .from('Slokas')
        .update({ Order: i + 1 })
        .eq('Id', order[i])
        .eq('ChapterId', chapterId);

      if (!error) updated++;
    }

    v2026Response(res, { updated });
  } catch (err) {
    v2026Error(res, err.message, 500);
  }
});

/**
 * DELETE /api/v2026/admin/slokas/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    // Delete vocabularies first
    await supabase.from('Vocabularies').delete().eq('SlokaId', id);

    // Delete sloka
    const { error } = await supabase
      .from('Slokas')
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
