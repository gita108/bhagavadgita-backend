/**
 * v2026 User Routes
 * Authenticated user endpoints
 */

const express = require('express');
const router = express.Router();
const { verifyAuth } = require('../../../middleware/auth');

// Import route handlers
const profileRoutes = require('./profile');
const favoritesRoutes = require('./favorites');

// Apply auth middleware to all user routes
router.use(verifyAuth);

// Mount routes
router.use('/profile', profileRoutes);
router.use('/favorites', favoritesRoutes);

module.exports = router;
