const { getSupabase } = require('../config/supabase');

/**
 * Full-text search across multiple tables
 */

/**
 * Search spots, routes, events by query
 * @param {string} query - Search query
 * @param {object} filters - { city, type }
 * @param {string} lang - Language code
 */
async function search(query, filters = {}, lang = 'en') {
  const supabase = getSupabase();
  const results = { spots: [], routes: [], events: [] };

  if (!query || query.length < 2) {
    return results;
  }

  const searchPattern = `%${query}%`;

  // Search spots
  let spotsQuery = supabase
    .from('spots')
    .select('*')
    .or(`name->>${lang}.ilike.${searchPattern},info->>${lang}.ilike.${searchPattern}`);

  if (filters.city) {
    spotsQuery = spotsQuery.eq('city', filters.city);
  }
  if (filters.type) {
    spotsQuery = spotsQuery.eq('type', filters.type);
  }

  // Search routes
  let routesQuery = supabase
    .from('routes')
    .select('*')
    .or(`name->>${lang}.ilike.${searchPattern},info->>${lang}.ilike.${searchPattern}`);

  if (filters.city) {
    routesQuery = routesQuery.eq('city_id', filters.city);
  }

  // Search events
  let eventsQuery = supabase
    .from('events')
    .select('*')
    .or(`name->>${lang}.ilike.${searchPattern},info->>${lang}.ilike.${searchPattern}`);

  if (filters.city) {
    eventsQuery = eventsQuery.eq('city_id', filters.city);
  }

  // Execute all queries in parallel
  const [spotsResult, routesResult, eventsResult] = await Promise.all([
    spotsQuery.limit(20),
    routesQuery.limit(20),
    eventsQuery.limit(20)
  ]);

  if (!spotsResult.error) results.spots = spotsResult.data || [];
  if (!routesResult.error) results.routes = routesResult.data || [];
  if (!eventsResult.error) results.events = eventsResult.data || [];

  return results;
}

module.exports = { search };
