/**
 * Transform Supabase 'places' row to v2012 'Place' model
 */

// Place types
const PLACE_TYPES = {
  HOTEL: 0,
  FOOD: 1
};

/**
 * @param {object} place - Supabase places row
 * @param {string} lang - Language code
 * @returns {object} v2012 Place model
 */
function transformPlaceToV2012(place, lang = 'en') {
  const name = getLocalizedValue(place.name, lang);
  const descr = getLocalizedValue(place.descr, lang);

  return {
    id: place.id,
    regionId: place.city_id,
    type: place.type || PLACE_TYPES.HOTEL,
    mainPhoto: place.main_photo || null,
    name: name,
    descr: descr,
    address: place.address || '',
    order: place.order || 0,
    isDeleted: place.is_deleted || false
  };
}

/**
 * Transform array of places
 */
function transformPlacesToV2012(places, lang = 'en') {
  return places.map(place => transformPlaceToV2012(place, lang));
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
  PLACE_TYPES,
  transformPlaceToV2012,
  transformPlacesToV2012
};
