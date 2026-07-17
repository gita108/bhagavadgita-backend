/**
 * Transform Supabase 'routes' row to v2012 'Guide' model
 */

/**
 * @param {object} route - Supabase routes row
 * @param {string} lang - Language code
 * @param {string[]} spotIds - Array of spot IDs in this guide
 * @returns {object} v2012 Guide model
 */
function transformRouteToGuide(route, lang = 'en', spotIds = []) {
  const name = getLocalizedValue(route.name, lang);
  const descr = getLocalizedValue(route.info, lang);
  const images = parseImages(route.images);

  return {
    id: route.id,
    parentId: route.parent_id || null,
    photo: images[0] || null,
    name: name,
    descr: descr,
    order: route.order || 0,
    isDeleted: false,
    spots: spotIds,
    spotsCount: spotIds.length
  };
}

/**
 * Transform array of routes to Guides
 */
function transformRoutesToGuides(routes, lang = 'en', spotsMap = {}) {
  return routes.map(route => {
    const spotIds = spotsMap[route.id] || [];
    return transformRouteToGuide(route, lang, spotIds);
  });
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
  transformRouteToGuide,
  transformRoutesToGuides
};
