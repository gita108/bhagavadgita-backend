/**
 * Language middleware - parses Accept-Language header
 * Supports: ru, en, hi (default: en)
 */
function languageMiddleware(req, res, next) {
  const acceptLanguage = req.headers['accept-language'] || 'en';

  // Parse language from header (e.g., "ru-RU,ru;q=0.9,en;q=0.8")
  const primaryLang = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();

  // Supported languages
  const supportedLangs = ['ru', 'en', 'hi'];
  req.lang = supportedLangs.includes(primaryLang) ? primaryLang : 'en';

  next();
}

module.exports = { languageMiddleware };
