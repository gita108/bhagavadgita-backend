const { getSupabase } = require('../config/supabase');

/**
 * Generic Supabase CRUD operations
 */

/**
 * Fetch all records from a table with optional filters
 */
async function fetchAll(table, options = {}) {
  const supabase = getSupabase();
  let query = supabase.from(table).select('*', { count: 'exact' });

  // Apply filters
  if (options.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value);
      }
    }
  }

  // Apply search (simple ILIKE on name field)
  if (options.search && options.searchField) {
    query = query.ilike(options.searchField, `%${options.search}%`);
  }

  // Apply sorting
  if (options.sortKey) {
    query = query.order(options.sortKey, {
      ascending: options.sortAscending !== false
    });
  }

  // Apply pagination
  if (options.offset !== undefined && options.limit !== undefined) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  }

  // Filter by lastLoad (for incremental sync)
  if (options.lastLoad) {
    const lastLoadDate = new Date(options.lastLoad * 1000).toISOString();
    query = query.gte('updated_at', lastLoadDate);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return { data: data || [], count: count || 0 };
}

/**
 * Fetch single record by ID
 */
async function fetchById(table, id) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data;
}

/**
 * Create new record
 */
async function create(table, record) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(table)
    .insert(record)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update record by ID
 */
async function update(table, id, updates) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete record by ID
 */
async function remove(table, id) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Fetch related IDs from junction table
 */
async function fetchJunctionIds(table, foreignKey, id, selectField) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(table)
    .select(selectField)
    .eq(foreignKey, id);

  if (error) throw error;
  return data ? data.map(row => row[selectField]) : [];
}

module.exports = {
  fetchAll,
  fetchById,
  create,
  update,
  remove,
  fetchJunctionIds
};
