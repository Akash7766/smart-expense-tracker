const logger = require('../utils/logger');

function parseAllowedOrigins(raw) {
  if (!raw || typeof raw !== 'string') return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * Fail fast before loading routes. Production (NODE_ENV=production) requires full config.
 */
function validateEnv() {
  const isProd = process.env.NODE_ENV === 'production';
  const missing = [];

  if (!process.env.MONGO_URI || !String(process.env.MONGO_URI).trim()) {
    missing.push('MONGO_URI');
  }

  if (isProd) {
    if (!process.env.PORT || !String(process.env.PORT).trim()) {
      missing.push('PORT');
    }
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON || !String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON).trim()) {
      missing.push('FIREBASE_SERVICE_ACCOUNT_JSON');
    }
    if (parseAllowedOrigins(process.env.ALLOWED_ORIGINS).length === 0) {
      missing.push('ALLOWED_ORIGINS (comma-separated, at least one origin)');
    }
  }

  if (missing.length > 0) {
    logger.error(
      `Server startup aborted — required environment variable(s) missing or empty:\n  - ${missing.join('\n  - ')}`
    );
    process.exit(1);
  }
}

module.exports = { validateEnv, parseAllowedOrigins };
