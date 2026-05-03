const logger = require('../utils/logger');

/**
 * Parse comma-separated origins from env (no trailing spaces).
 * @param {string | undefined} value
 * @returns {string[]}
 */
function splitOrigins(value) {
  if (!value || typeof value !== 'string') return [];
  return value.split(',').map((o) => o.trim()).filter(Boolean);
}

/**
 * Allowed browser origins for CORS. Built only from environment variables so nothing
 * is hardcoded (works on Render, local .env supplies localhost values).
 *
 * Uses ALLOWED_ORIGINS and FRONTEND_URL (legacy); both may be comma-separated lists.
 */
function getAllowedOrigins() {
  const list = [...splitOrigins(process.env.ALLOWED_ORIGINS), ...splitOrigins(process.env.FRONTEND_URL)];
  const unique = [...new Set(list)];
  if (unique.length === 0) {
    logger.warn(
      'CORS allowlist is empty — set ALLOWED_ORIGINS and/or FRONTEND_URL (comma-separated origins). Browser API calls will fail until configured.'
    );
  }
  return unique;
}

module.exports = { getAllowedOrigins, splitOrigins };
