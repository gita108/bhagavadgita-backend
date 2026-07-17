/**
 * Legacy Storage Routes
 * Handles /Files/* requests for audio files
 * Returns 302 redirect to Supabase Storage public URL
 */

const express = require('express');
const router = express.Router();
const { buildPublicRedirectUrl } = require('../services/storageService');

/**
 * Handle /Files/* and /files/* requests
 * Redirect to Supabase Storage public URL
 */
function redirectFile(req, res) {
  // Get path after /Files/ or /files/
  const filePath = req.params[0];

  if (!filePath) {
    return res.status(404).send('Not Found');
  }

  // Security: reject path traversal
  if (filePath.includes('..') || filePath.includes('//')) {
    return res.status(400).send('Invalid path');
  }

  // Build redirect URL
  const redirectUrl = buildPublicRedirectUrl(filePath);

  // Set cache headers (24 hours)
  res.set('Cache-Control', 'public, max-age=86400');

  // 302 redirect
  res.redirect(302, redirectUrl);
}

// Mount routes (both cases for compatibility)
router.get('/Files/*', redirectFile);
router.get('/files/*', redirectFile);

module.exports = router;
