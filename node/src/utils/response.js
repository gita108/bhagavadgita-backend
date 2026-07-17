/**
 * Response helpers for v2012 and v2026 API formats
 */

// v2012 Response Codes
const V2012_CODES = {
  SUCCESS: 0,
  ERROR: 1,
  CONNECTION_ERROR: 100
};

/**
 * v2012 success response
 */
function v2012Response(res, data = []) {
  return res.json({
    code: V2012_CODES.SUCCESS,
    msg: '',
    data: Array.isArray(data) ? data : [data]
  });
}

/**
 * v2012 error response
 */
function v2012Error(res, msg, code = V2012_CODES.ERROR) {
  return res.json({
    code,
    msg,
    data: []
  });
}

/**
 * v2026 success response with optional pagination
 */
function v2026Response(res, data, pagination = null) {
  const response = {
    success: true,
    data
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return res.json(response);
}

/**
 * v2026 error response
 */
function v2026Error(res, error, status = 400) {
  return res.status(status).json({
    success: false,
    error: typeof error === 'string' ? error : error.message,
    data: null
  });
}

module.exports = {
  V2012_CODES,
  v2012Response,
  v2012Error,
  v2026Response,
  v2026Error
};
