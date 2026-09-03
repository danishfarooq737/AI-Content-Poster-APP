const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const app = require('./app');
const { connectDB } = require('./config/db');
const { startScheduler, stopScheduler } = require('./services/schedulerService');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'ENCRYPTION_KEY'];

const validateEnv = () => {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    logger.error('Copy .env.example to .env and fill in the required values.');
    process.exit(1);
  }
};

let server;

const start = async () => {
  validateEnv();

  try {
    await connectDB();
  } catch (err) {
    // Fail gracefully with a clear message instead of crashing with a raw stack trace.
    logger.error(`Could not connect to MongoDB: ${err.message}`);
    logger.error('The application cannot start without a database connection. Check MONGODB_URI in .env.');
    process.exit(1);
  }

  server = app.listen(PORT, () => {
    logger.info(`ViralPost API listening on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });

  if (process.env.NODE_ENV !== 'test') {
    startScheduler();
  }
};

const shutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  stopScheduler();
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled rejection: ${reason}`);
});

start();

module.exports = app;
