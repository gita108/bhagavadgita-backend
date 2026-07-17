/**
 * Book Transformer for v2012 API
 * Transforms Supabase Books table to v2012 Book model
 */

/**
 * Transform single book
 * @param {Object} book - Book row from Supabase
 * @param {number} chaptersCount - Number of chapters in the book
 * @returns {Object} v2012 Book model
 */
function transformBook(book, chaptersCount = 0) {
  return {
    id: book.Id,
    languageId: book.LanguageId,
    name: book.Name,
    initials: book.Initials,
    chaptersCount: chaptersCount
  };
}

/**
 * Transform array of books
 * @param {Array} books - Array of book rows
 * @param {Object} countMap - Map of bookId -> chaptersCount
 * @returns {Array} Array of v2012 Book models
 */
function transformBooks(books, countMap = {}) {
  return (books || []).map(book => transformBook(book, countMap[book.Id] || 0));
}

module.exports = {
  transformBook,
  transformBooks
};
