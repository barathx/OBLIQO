import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { ObligationsService } from './services/obligations.service.js';
import { ReminderScheduler } from './services/reminder-scheduler.service.js';

const server = app.listen(env.PORT, async () => {
  logger.info(`Server started on port ${env.PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
  logger.info(`CORS configured for origin: ${env.FRONTEND_URL}`);

  try {
    const isDbConnected = await ObligationsService.checkDatabaseConnection();
    if (isDbConnected) {
      logger.info('Database connected');
      // Start reminder scheduler once backend starts
      ReminderScheduler.start(60000);
    } else {
      logger.warn('Database connection check failed at startup. Ensure PostgreSQL is running.');
    }
  } catch (error) {
    logger.warn('Database connection check error:', error);
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  ReminderScheduler.stop();
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  ReminderScheduler.stop();
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});
