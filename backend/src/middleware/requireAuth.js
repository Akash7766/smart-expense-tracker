const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { getFirebaseAuth } = require('../config/firebaseAdmin');

/**
 * Verifies Firebase ID token from Authorization: Bearer <token>
 * Attaches req.user = { uid, email }
 */
const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return next(new AppError('Authentication required', 401));
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      return next(new AppError('Authentication required', 401));
    }

    const auth = getFirebaseAuth();
    const decoded = await auth.verifyIdToken(token);

    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
    };

    next();
  } catch (err) {
    if (err.message === 'Firebase Admin is not configured') {
      logger.error('Auth middleware: Firebase Admin missing');
      return next(new AppError('Server authentication is not configured', 503));
    }
    logger.warn(`Auth verification failed: ${err.message}`);
    return next(new AppError('Invalid or expired token', 401));
  }
};

module.exports = { requireAuth };
