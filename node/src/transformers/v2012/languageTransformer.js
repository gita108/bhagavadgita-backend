/**
 * Language Transformer for v2012 API
 * Transforms Supabase Languages table to v2012 Language model
 */

/**
 * Transform single language
 * @param {Object} lang - Language row from Supabase
 * @returns {Object} v2012 Language model
 */
function transformLanguage(lang) {
  return {
    id: lang.Id,
    name: lang.Name,
    code: lang.Code
  };
}

/**
 * Transform array of languages
 * @param {Array} languages - Array of language rows
 * @returns {Array} Array of v2012 Language models
 */
function transformLanguages(languages) {
  return (languages || []).map(transformLanguage);
}

module.exports = {
  transformLanguage,
  transformLanguages
};
