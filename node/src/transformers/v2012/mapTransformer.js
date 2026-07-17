/**
 * Transform Supabase 'offline_maps' row to v2012 'Map' model
 */

/**
 * @param {object} map - Supabase offline_maps row
 * @returns {object} v2012 Map model
 */
function transformMapToV2012(map) {
  return {
    id: map.id,
    regionId: map.city_id,
    file: map.file || null,
    isDeleted: map.is_deleted || false
  };
}

/**
 * Transform array of maps
 */
function transformMapsToV2012(maps) {
  return maps.map(m => transformMapToV2012(m));
}

module.exports = {
  transformMapToV2012,
  transformMapsToV2012
};
