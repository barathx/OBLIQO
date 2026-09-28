import { Request, Response, NextFunction } from 'express';
import { ObligationExtractorService } from '../services/ai/obligation-extractor.service.js';
import { ObligationsService } from '../services/obligations.service.js';
import { ObligationSource } from '@prisma/client';

const extractorService = new ObligationExtractorService();

export class AIController {
  /**
   * POST /api/ai/extract-obligation
   * Extracts structured obligation JSON from raw text without saving to DB.
   */
  static async extractObligation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { text } = req.body as { text: string };

      const result = await extractorService.extractObligationFromText(text);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes('AI extraction is temporarily unavailable') ||
          error.message.includes('AI extraction timed out') ||
          error.message.includes('AI extraction returned invalid JSON')
        ) {
          res.status(503).json({
            success: false,
            message: 'AI extraction is temporarily unavailable',
          });
          return;
        }
      }
      next(error);
    }
  }

  /**
   * POST /api/ai/create-obligation
   * Extracts obligation from raw text and saves to DB using existing Phase 2 pipeline.
   */
  static async createObligationFromText(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { text, source, sourceMessageId } = req.body as {
        text: string;
        source?: ObligationSource;
        sourceMessageId?: string;
      };

      const demoUser = await ObligationsService.getOrCreateDemoUser();

      // 1. AI Extraction
      const extractionResult = await extractorService.extractObligationFromText(text);

      if (!extractionResult.isObligation || !extractionResult.obligation) {
        res.status(400).json({
          success: false,
          message: extractionResult.reason || 'No actionable obligation detected in text',
        });
        return;
      }

      const ext = extractionResult.obligation;

      // 2. Reuse Phase 2 Obligation Creation Pipeline (handles duplicate check, DB insert, ActivityEvent, Notification)
      const creationResult = await ObligationsService.createObligation(
        {
          title: ext.title,
          description: ext.description,
          category: ext.category,
          amount: ext.amount,
          currency: ext.currency,
          deadline: ext.deadline,
          priority: ext.priority,
          recurrence: ext.recurrence,
          source: source || ObligationSource.MANUAL,
          sourceMessageId,
        },
        demoUser.id
      );

      if (creationResult.isDuplicate) {
        res.status(200).json({
          success: true,
          message: 'Duplicate obligation detected',
          duplicate: true,
          data: creationResult.obligation,
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Obligation created from text successfully',
        data: creationResult.obligation,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes('AI extraction is temporarily unavailable') ||
          error.message.includes('AI extraction timed out')
        ) {
          res.status(503).json({
            success: false,
            message: 'AI extraction is temporarily unavailable',
          });
          return;
        }
        if (error.message.includes('Source message not found')) {
          res.status(400).json({
            success: false,
            message: error.message,
          });
          return;
        }
      }
      next(error);
    }
  }
}
