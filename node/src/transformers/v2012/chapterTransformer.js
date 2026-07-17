/**
 * Chapter Transformer for v2012 API
 * Transforms Supabase Chapters/Slokas/Vocabularies to v2012 nested model
 */

/**
 * Transform single vocabulary item
 * @param {Object} vocab - Vocabulary row from Supabase
 * @returns {Object} v2012 Vocabulary model
 */
function transformVocabulary(vocab) {
  return {
    text: vocab.Text || '',
    translation: vocab.Translation || ''
  };
}

/**
 * Transform single sloka (verse)
 * @param {Object} sloka - Sloka row from Supabase
 * @param {Array} vocabularies - Array of vocabulary rows for this sloka
 * @returns {Object} v2012 Sloka model
 */
function transformSloka(sloka, vocabularies = []) {
  return {
    name: sloka.Name || '',
    text: sloka.Text || '',
    transcription: sloka.Transcription || '',
    translation: sloka.Translation || '',
    comment: sloka.Comment || '',
    order: sloka.Order || 0,
    audio: sloka.Audio || '',
    audioSanskrit: sloka.AudioSanskrit || '',
    vocabularies: vocabularies.map(transformVocabulary)
  };
}

/**
 * Transform single chapter with nested slokas
 * @param {Object} chapter - Chapter row from Supabase
 * @param {Array} slokas - Array of sloka rows for this chapter
 * @param {Object} vocabulariesMap - Map of slokaId -> vocabularies array
 * @returns {Object} v2012 Chapter model
 */
function transformChapter(chapter, slokas = [], vocabulariesMap = {}) {
  return {
    name: chapter.Name || '',
    order: chapter.Order || 0,
    slokas: slokas.map(sloka =>
      transformSloka(sloka, vocabulariesMap[sloka.Id] || [])
    )
  };
}

/**
 * Transform array of chapters with nested data
 * @param {Array} chapters - Array of chapter rows
 * @param {Object} slokasMap - Map of chapterId -> slokas array
 * @param {Object} vocabulariesMap - Map of slokaId -> vocabularies array
 * @returns {Array} Array of v2012 Chapter models
 */
function transformChapters(chapters, slokasMap = {}, vocabulariesMap = {}) {
  return (chapters || []).map(chapter =>
    transformChapter(chapter, slokasMap[chapter.Id] || [], vocabulariesMap)
  );
}

module.exports = {
  transformVocabulary,
  transformSloka,
  transformChapter,
  transformChapters
};
