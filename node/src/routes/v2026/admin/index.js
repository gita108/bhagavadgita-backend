/**
 * v2026 Admin Routes
 * Bhagavad-Gita admin panel API
 */

const express = require('express');
const router = express.Router();

// Import route handlers
const authRoutes = require('./auth');
const languagesRoutes = require('./languages');
const booksRoutes = require('./books');
const chaptersRoutes = require('./chapters');
const slokasRoutes = require('./slokas');
const quotesRoutes = require('./quotes');
const devicesRoutes = require('./devices');
const importRoutes = require('./import');
const filesRoutes = require('./files');

// Auth routes (no auth required for login)
router.use('/auth', authRoutes);

// Protected routes (TODO: add auth middleware)
router.use('/languages', languagesRoutes);
router.use('/books', booksRoutes);
router.use('/chapters', chaptersRoutes);
router.use('/slokas', slokasRoutes);
router.use('/quotes', quotesRoutes);
router.use('/devices', devicesRoutes);
router.use('/import', importRoutes);
router.use('/files', filesRoutes);

module.exports = router;
