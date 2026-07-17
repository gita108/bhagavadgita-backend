/**
 * Pagination utilities
 */

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

/**
 * Parse pagination params from query
 */
function parsePagination(query) {
  let page = parseInt(query.page) || DEFAULT_PAGE;
  let pageSize = parseInt(query.pageSize) || DEFAULT_PAGE_SIZE;

  // Validate
  if (page < 1) page = DEFAULT_PAGE;
  if (pageSize < 1) pageSize = DEFAULT_PAGE_SIZE;
  if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;

  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset };
}

/**
 * Build pagination response object
 */
function buildPaginationResponse(page, pageSize, totalCount) {
  return {
    page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize)
  };
}

/**
 * Apply pagination to Supabase query
 */
function applyPagination(query, { offset, pageSize }) {
  return query.range(offset, offset + pageSize - 1);
}

module.exports = {
  parsePagination,
  buildPaginationResponse,
  applyPagination
};
