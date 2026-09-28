import { Request, Response, NextFunction } from 'express';
import { ObligationsService } from '../services/obligations.service.js';

export class HealthController {
  /**
   * GET /api/health
   */
  static getHealth(_req: Request, res: Response): void {
    res.status(200).json({
      success: true,
      message: 'Obliqo backend is running',
    });
  }

  /**
   * GET /api/health/database
   */
  static async getDatabaseHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isConnected = await ObligationsService.checkDatabaseConnection();
      if (isConnected) {
        res.status(200).json({
          success: true,
          message: 'Database connection is healthy',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Database connection failed',
        });
      }
    } catch (error) {
      next(error);
    }
  }
}
