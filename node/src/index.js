require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Config
const { initSupabase } = require('./config/supabase');
const { setupSwagger } = require('./config/swagger');

// Middleware
const { languageMiddleware } = require('./middleware/language');
const { errorHandler } = require('./middleware/errorHandler');

// Routes
const v2012Routes = require('./routes/v2012');
const v2026Routes = require('./routes/v2026');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase
initSupabase();

// Global Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(languageMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', v2012Routes);           // v2012 API for mobile apps
app.use('/api/v2026', v2026Routes);     // v2026 API for admin/site

// Swagger documentation
setupSwagger(app);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 HolySpots Backend running on port ${PORT}`);
  console.log(`📚 Swagger v2012: http://localhost:${PORT}/api-docs`);
  console.log(`📚 Swagger v2026: http://localhost:${PORT}/api/v2026-docs`);
});

module.exports = app;
