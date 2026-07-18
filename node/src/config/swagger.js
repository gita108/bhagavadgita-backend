const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const fs = require('fs');

function setupSwagger(app) {
  // v2012 API docs
  const v2012Path = path.join(__dirname, '../docs/v2012.yaml');
  if (fs.existsSync(v2012Path)) {
    const v2012Spec = YAML.load(v2012Path);
    app.use('/api-docs', swaggerUi.serveFiles(v2012Spec), swaggerUi.setup(v2012Spec));
  }

  // v2026 API docs
  const v2026Path = path.join(__dirname, '../docs/v2026.yaml');
  if (fs.existsSync(v2026Path)) {
    const v2026Spec = YAML.load(v2026Path);
    app.use('/api/v2026-docs', swaggerUi.serveFiles(v2026Spec), swaggerUi.setup(v2026Spec));
  }

  // v2026 Admin API docs
  const v2026AdminPath = path.join(__dirname, '../docs/v2026-admin.yaml');
  if (fs.existsSync(v2026AdminPath)) {
    const v2026AdminSpec = YAML.load(v2026AdminPath);
    app.use('/api/v2026-admin-docs', swaggerUi.serveFiles(v2026AdminSpec), swaggerUi.setup(v2026AdminSpec));
  }
}

module.exports = { setupSwagger };
