/**
 * Transform Supabase 'spots' row to v2012 'Spot' model
 */

/**
 * @param {object} spot - Supabase spots row
 * @param {string} lang - Language code
 * @param {string[]} regionIds - Array of region (city) IDs this spot belongs to
 * @returns {object} v2012 Spot model
 */
function transformSpotToV2012(spot, lang = 'en', regionIds = []) {
  const name = getLocalizedValue(spot.name, lang);
  const info = getLocalizedValue(spot.info, lang);
  const images = parseImages(spot.images);

  // Parse coordinates from GeoJSON point
  let latitude = 0;
  let longitude = 0;
  if (spot.point && spot.point.coordinates) {
    longitude = spot.point.coordinates[0] || 0;
    latitude = spot.point.coordinates[1] || 0;
  }

  // Build photos array (skip first image which is mainPhoto)
  const photos = images.slice(1).map((photo, index) => ({
    id: index + 1,
    photo: photo,
    isDeleted: false
  }));

  return {
    id: spot.id,
    mainPhoto: images[0] || null,
    name: name,
    info: truncate(info, 100),
    descr: info,
    latitude: latitude,
    longitude: longitude,
    workDays: 127, // All days (bitmask: Mon=1, Tue=2, Wed=4, Thu=8, Fri=16, Sat=32, Sun=64)
    timeZone: 'Asia/Kolkata',
    order: spot.order || 0,
    isDeleted: false,
    beaconId: null,
    beaconMajor: null,
    beaconMinor: null,
    workTimes: [], // Could be parsed from info or separate field
    regions: regionIds.length > 0 ? regionIds : [spot.city],
    photos: photos,
    videos: []
  };
}

/**
 * Transform array of spots
 */
function transformSpotsToV2012(spots, lang = 'en') {
  return spots.map(spot => transformSpotToV2012(spot, lang, [spot.city]));
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

/**
 * Helper: Truncate string
 */
function truncate(str, length) {
  if (!str || str.length <= length) return str;
  return str.substring(0, length) + '...';
}

module.exports = {
  transformSpotToV2012,
  transformSpotsToV2012
};
