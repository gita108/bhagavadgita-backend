/**
 * v2012 API Routes
 * Compatible with holyspots-mobile-java-v2012 and holyspots-mobile-swift-v2012
 */

const express = require('express');
const router = express.Router();

// Import route handlers
const regionsRoutes = require('./regions');
const spotsRoutes = require('./spots');
const guidesRoutes = require('./guides');
const mapsRoutes = require('./maps');
const reviewsRoutes = require('./reviews');
const placesRoutes = require('./places');
const directionsRoutes = require('./directions');

// Mount routes under /Data prefix (matching v2012 API format)
router.use('/Data', regionsRoutes);
router.use('/Data', spotsRoutes);
router.use('/Data', guidesRoutes);
router.use('/Data', mapsRoutes);
router.use('/Data', reviewsRoutes);
router.use('/Data', placesRoutes);
router.use('/Data', directionsRoutes);

module.exports = router;
