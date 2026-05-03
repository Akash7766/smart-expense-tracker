require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { initFirebaseAdmin } = require('./config/firebaseAdmin');

const PORT = Number.parseInt(process.env.PORT, 10) || 5000;

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception — exiting', { message: err.message, stack: err.stack });
  process.exit(1);
});

const startServer = async () => {
  try {
    await connectDB();
    try {
      const firebaseReady = initFirebaseAdmin();
      if (!firebaseReady) {
        logger.warn('Protected APIs (/api/expenses, /api/insights) return 503 until Firebase Admin credentials are configured — see backend/.env.example');
      }
    } catch (firebaseErr) {
      logger.error('Firebase Admin failed to initialize', { message: firebaseErr.message });
    }
    app.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT} [${process.env.NODE_ENV || 'undefined'}]`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
