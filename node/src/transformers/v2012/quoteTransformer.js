/**
 * Quote Transformer for v2012 API
 * Transforms Supabase Quotes table to v2012 Quote model
 */

/**
 * Transform single quote
 * @param {Object} quote - Quote row from Supabase
 * @returns {Object} v2012 Quote model
 */
function transformQuote(quote) {
  return {
    author: quote.Author || '',
    text: quote.Text || ''
  };
}

module.exports = {
  transformQuote
};
