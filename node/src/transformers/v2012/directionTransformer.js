/**
 * Transform Supabase 'directions' row to v2012 'Direction' model
 */

/**
 * @param {object} direction - Supabase directions row
 * @param {string} lang - Language code
 * @returns {object} v2012 Direction model
 */
function transformDirectionToV2012(direction, lang = 'en') {
  const name = getLocalizedValue(direction.name, lang);
  const descr = getLocalizedValue(direction.descr, lang);

  return {
    id: direction.id,
    regionId: direction.city_id,
    name: name,
    descr: descr,
    order: direction.order || 0,
    isDeleted: direction.is_deleted || false
  };
}

/**
 * Transform array of directions
 */
function transformDirectionsToV2012(directions, lang = 'en') {
  return directions.map(dir => transformDirectionToV2012(dir, lang));
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

module.exports = {
  transformDirectionToV2012,
  transformDirectionsToV2012
};
