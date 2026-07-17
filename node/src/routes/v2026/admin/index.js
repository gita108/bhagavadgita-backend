/**
 * v2026 Admin Routes
 * Full CRUD operations for admin panels
 */

const express = require('express');
const router = express.Router();

// Import route handlers
const citiesRoutes = require('./cities');
const spotsRoutes = require('./spots');
const routesRoutes = require('./routes');
const eventsRoutes = require('./events');
const placesRoutes = require('./places');
const directionsRoutes = require('./directions');
const mapsRoutes = require('./maps');
const filesRoutes = require('./files');

// Mount routes
router.use('/cities', citiesRoutes);
router.use('/spots', spotsRoutes);
router.use('/routes', routesRoutes);
router.use('/events', eventsRoutes);
router.use('/places', placesRoutes);
router.use('/directions', directionsRoutes);
router.use('/maps', mapsRoutes);
router.use('/files', filesRoutes);

module.exports = router;
