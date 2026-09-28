import { ReminderService } from './reminder.service.js';
import { logger } from '../utils/logger.js';

export class ReminderScheduler {
  private static timer: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * Start the reminder scheduler singleton interval.
   */
  static start(intervalMs: number = 60000): void {
    if (this.timer) {
      logger.warn('[REMINDER] Scheduler already running');
      return;
    }

    logger.info('[REMINDER] Scheduler started');

    // Run first tick asynchronously
    this.tick();

    this.timer = setInterval(() => {
      this.tick();
    }, intervalMs);
  }

  /**
   * Stop the reminder scheduler interval gracefully.
   */
  static stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info('[REMINDER] Scheduler stopped');
    }
  }

  /**
   * Execute a single scheduler cycle.
   */
  static async tick(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      logger.info('[REMINDER] Checking due reminders');
      await ReminderService.generateRemindersForActiveObligations();
      await ReminderService.processDueReminders();
      await ReminderService.processOverdueObligations();
    } catch (error) {
      logger.error('[REMINDER] Scheduler error:', error);
    } finally {
      this.isRunning = false;
    }
  }
}
