/**
 * Transform Supabase 'cities' row to v2012 'Region' model
 */

/**
 * @param {object} city - Supabase cities row
 * @param {string} lang - Language code (ru, en, hi)
 * @returns {object} v2012 Region model
 */
function transformCityToRegion(city, lang = 'en') {
  const name = getLocalizedValue(city.name, lang);
  const descr = getLocalizedValue(city.info, lang);
  const images = parseImages(city.images);

  return {
    id: city.id,
    photo: images[0] || null,
    name: name,
    descr: descr,
    order: city.order || 0,
    isDeleted: false,
    spotsCount: city.spots_count || 0
  };
}

/**
 * Transform array of cities to Regions
 */
function transformCitiesToRegions(cities, lang = 'en') {
  return cities.map(city => transformCityToRegion(city, lang));
}

/**
 * Helper: Get localized value from JSONB
 */
function getLocalizedValue(jsonb, lang) {
  if (!jsonb) return '';
  if (typeof jsonb === 'string') {
    try {
      jsonb = JSON.parse(jsonb);
    } catch {
      return jsonb;
    }
  }
  return jsonb[lang] || jsonb.en || jsonb.ru || '';
}

/**
 * Helper: Parse images array
 */
function parseImages(images) {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  if (typeof images === 'string') {
    try {
      return JSON.parse(images);
    } catch {
      return [];
    }
  }
  return [];
}

module.exports = {
  transformCityToRegion,
  transformCitiesToRegions
};
