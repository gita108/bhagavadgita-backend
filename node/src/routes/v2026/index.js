/**
 * v2026 API Routes
 * Modern REST API for admin panels and website
 */

const express = require('express');
const router = express.Router();

// Import route handlers
const adminRoutes = require('./admin');
const publicRoutes = require('./public');
const userRoutes = require('./user');

// Mount routes
router.use('/admin', adminRoutes);
router.use('/public', publicRoutes);
router.use('/user', userRoutes);

module.exports = router;
