require('dotenv').config();
const logger = require('./utils/logger');
const { validateEnv } = require('./config/validateEnv');

validateEnv();

const app = require('./app');
const connectDB = require('./config/db');
const { initFirebaseAdmin } = require('./config/firebaseAdmin');

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
      const isProd = process.env.NODE_ENV === 'production';
      if (isProd) {
        initFirebaseAdmin();
      } else {
        const ok = initFirebaseAdmin();
        if (!ok) {
          logger.warn('Protected APIs (/api/expenses, /api/insights) return 503 until Firebase Admin is configured');
        }
      }
    } catch (err) {
      logger.error(`Firebase Admin: ${err.message}`);
      process.exit(1);
    }

    const isProd = process.env.NODE_ENV === 'production';
    const port = isProd ? process.env.PORT : process.env.PORT || 5000;

    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
