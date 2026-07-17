/**
 * v2012 API Routes
 * Compatible with bhagavadgita-mobile-java-v2012 and bhagavadgita-mobile-swift-v2012
 */

const express = require('express');
const router = express.Router();

// Import Bhagavad-Gita route handlers
const languagesRoutes = require('./languages');
const booksRoutes = require('./books');
const chaptersRoutes = require('./chapters');
const quotesRoutes = require('./quotes');

// Mount routes under /Data prefix (matching v2012 API format)
router.use('/Data', languagesRoutes);
router.use('/Data', booksRoutes);
router.use('/Data', chaptersRoutes);
router.use('/Data', quotesRoutes);

module.exports = router;
