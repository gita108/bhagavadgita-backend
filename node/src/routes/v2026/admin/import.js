/**
 * v2026 Admin Import Routes
 * XML import for books
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getSupabase } = require('../../../config/supabase');
const { v2026Response, v2026Error } = require('../../../utils/response');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

/**
 * Simple XML parser for book.xml format
 */
function parseBookXml(xmlString) {
  const chapters = [];
  const warnings = [];

  // Parse chapters
  const chapterRegex = /<chapter[^>]*>([\s\S]*?)<\/chapter>/gi;
  let chapterMatch;
  let chapterOrder = 0;

  while ((chapterMatch = chapterRegex.exec(xmlString)) !== null) {
    chapterOrder++;
    const chapterContent = chapterMatch[1];

    // Get chapter name
    const nameMatch = chapterContent.match(/<name>([\s\S]*?)<\/name>/i);
    const chapterName = nameMatch ? nameMatch[1].trim() : `Chapter ${chapterOrder}`;

    const slokas = [];
    const slokaRegex = /<sloka[^>]*>([\s\S]*?)<\/sloka>/gi;
    let slokaMatch;
    let slokaOrder = 0;

    while ((slokaMatch = slokaRegex.exec(chapterContent)) !== null) {
      slokaOrder++;
      const slokaContent = slokaMatch[1];

      const sloka = {
        name: extractTag(slokaContent, 'number') || extractTag(slokaContent, 'name') || `${chapterOrder}.${slokaOrder}`,
        text: extractTag(slokaContent, 'sanskrit') || extractTag(slokaContent, 'text') || '',
        transcription: extractTag(slokaContent, 'transcription') || '',
        translation: extractTag(slokaContent, 'translation') || '',
        comment: extractTag(slokaContent, 'comment') || extractTag(slokaContent, 'commentary') || '',
        order: slokaOrder,
        audio: extractTag(slokaContent, 'audio') || '',
        audioSanskrit: extractTag(slokaContent, 'audioSanskrit') || extractTag(slokaContent, 'audio_sanskrit') || '',
        vocabularies: []
      };

      // Parse vocabularies
      const vocabRegex = /<vocabulary[^>]*>([\s\S]*?)<\/vocabulary>/gi;
      let vocabMatch;

      while ((vocabMatch = vocabRegex.exec(slokaContent)) !== null) {
        const vocabContent = vocabMatch[1];
        sloka.vocabularies.push({
          text: extractTag(vocabContent, 'word') || extractTag(vocabContent, 'text') || '',
          translation: extractTag(vocabContent, 'meaning') || extractTag(vocabContent, 'translation') || ''
        });
      }

      // Also try word-by-word format
      const wordRegex = /<word[^>]*>([\s\S]*?)<\/word>/gi;
      let wordMatch;

      while ((wordMatch = wordRegex.exec(slokaContent)) !== null) {
        const wordContent = wordMatch[1];
        sloka.vocabularies.push({
          text: extractTag(wordContent, 'text') || extractTag(wordContent, 'sanskrit') || '',
          translation: extractTag(wordContent, 'meaning') || extractTag(wordContent, 'translation') || ''
        });
      }

      // Check for warnings
      if (!sloka.comment) {
        warnings.push(`Empty comment at ${sloka.name}`);
      }

      slokas.push(sloka);
    }

    chapters.push({
      name: chapterName,
      order: chapterOrder,
      slokas
    });
  }

  return { chapters, warnings };
}

function extractTag(content, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * POST /api/v2026/admin/import/xml
 * Upload and import book.xml
 */
router.post('/xml', upload.single('file'), async (req, res) => {
  try {
    const supabase = getSupabase();
    const { bookId } = req.body;

    if (!req.file) {
      return v2026Error(res, 'No file provided', 400);
    }

    if (!bookId) {
      return v2026Error(res, 'bookId is required', 400);
    }

    // Parse XML
    const xmlContent = req.file.buffer.toString('utf-8');
    const { chapters, warnings } = parseBookXml(xmlContent);

    if (chapters.length === 0) {
      return v2026Error(res, 'No chapters found in XML', 400);
    }

    // Get existing chapters to delete
    const { data: existingChapters } = await supabase
      .from('Chapters')
      .select('Id')
      .eq('BookId', bookId);

    if (existingChapters && existingChapters.length > 0) {
      const chapterIds = existingChapters.map(c => c.Id);

      // Get existing slokas
      const { data: existingSlokas } = await supabase
        .from('Slokas')
        .select('Id')
        .in('ChapterId', chapterIds);

      if (existingSlokas && existingSlokas.length > 0) {
        const slokaIds = existingSlokas.map(s => s.Id);

        // Delete vocabularies
        await supabase.from('Vocabularies').delete().in('SlokaId', slokaIds);

        // Delete slokas
        await supabase.from('Slokas').delete().in('ChapterId', chapterIds);
      }

      // Delete chapters
      await supabase.from('Chapters').delete().eq('BookId', bookId);
    }

    // Get max IDs
    const [maxChapterId, maxSlokaId, maxVocabId] = await Promise.all([
      supabase.from('Chapters').select('Id').order('Id', { ascending: false }).limit(1),
      supabase.from('Slokas').select('Id').order('Id', { ascending: false }).limit(1),
      supabase.from('Vocabularies').select('Id').order('Id', { ascending: false }).limit(1)
    ]);

    let chapterId = (maxChapterId.data?.[0]?.Id || 0) + 1;
    let slokaId = (maxSlokaId.data?.[0]?.Id || 0) + 1;
    let vocabId = (maxVocabId.data?.[0]?.Id || 0) + 1;

    let totalSlokas = 0;
    let totalVocabularies = 0;

    // Insert chapters, slokas, vocabularies
    for (const chapter of chapters) {
      const currentChapterId = chapterId++;

      await supabase.from('Chapters').insert({
        Id: currentChapterId,
        BookId: parseInt(bookId),
        Name: chapter.name,
        Order: chapter.order
      });

      for (const sloka of chapter.slokas) {
        const currentSlokaId = slokaId++;
        totalSlokas++;

        await supabase.from('Slokas').insert({
          Id: currentSlokaId,
          ChapterId: currentChapterId,
          Name: sloka.name,
          Text: sloka.text,
          Transcription: sloka.transcription,
          Translation: sloka.translation,
          Comment: sloka.comment,
          Order: sloka.order,
          Audio: sloka.audio,
          AudioSanskrit: sloka.audioSanskrit
        });

        for (const vocab of sloka.vocabularies) {
          if (vocab.text || vocab.translation) {
            totalVocabularies++;
            await supabase.from('Vocabularies').insert({
              Id: vocabId++,
              SlokaId: currentSlokaId,
              Text: vocab.text,
              Translation: vocab.translation
            });
          }
        }
      }
    }

    v2026Response(res, {
      chapters: chapters.length,
      slokas: totalSlokas,
      vocabularies: totalVocabularies,
      warnings
    });
  } catch (err) {
    console.error('XML import error:', err);
    v2026Error(res, err.message, 500);
  }
});

module.exports = router;
