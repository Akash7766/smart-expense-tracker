const logger = require('../utils/logger');
const { parseAllowedOrigins } = require('./validateEnv');

/**
 * CORS allowlist from ALLOWED_ORIGINS only (comma-separated). No FRONTEND_URL merge.
 */
function getAllowedOrigins() {
  const unique = [...new Set(parseAllowedOrigins(process.env.ALLOWED_ORIGINS))];
  if (unique.length === 0) {
    logger.warn(
      'ALLOWED_ORIGINS is empty — browser requests with an Origin header will be rejected by CORS until set.'
    );
  }
  return unique;
}

module.exports = { getAllowedOrigins, splitOrigins: parseAllowedOrigins };
