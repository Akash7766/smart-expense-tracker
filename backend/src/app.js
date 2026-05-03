const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const expenseRoutes = require('./routes/expense.routes');
const insightRoutes = require('./routes/insight.routes');
const errorHandler = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');
const logger = require('./utils/logger');
const { getAllowedOrigins } = require('./config/corsOrigins');

const app = express();

const allowedOrigins = getAllowedOrigins();

// Security middleware
app.use(helmet());

// CORS — only origins listed in ALLOWED_ORIGINS (comma-separated). Unknown origins rejected.
app.use(
  cors({
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      logger.warn(`CORS rejected origin: ${origin}`);
      return callback(null, false);
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// HTTP request logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.http(message.trim()) },
}));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Smart Expense Tracker API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Basic API root health route
app.get('/api', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
  });
});

// API Routes
app.use('/api/expenses', expenseRoutes);
app.use('/api/insights', insightRoutes);

// 404 handler
app.use(notFound);

// Centralized error handler (must be last)
app.use(errorHandler);

module.exports = app;
