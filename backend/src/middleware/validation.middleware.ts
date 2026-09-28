import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import {
  Priority,
  ObligationStatus,
  Recurrence,
  ObligationCategory,
  ObligationSource,
} from '@prisma/client';

export const createObligationSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().trim().optional(),
  category: z.nativeEnum(ObligationCategory, {
    errorMap: () => ({ message: 'Invalid category. Must be a valid ObligationCategory enum.' }),
  }).optional().default(ObligationCategory.OTHER),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .nonnegative('Amount must not be negative')
    .optional(),
  currency: z.string().trim().length(3, 'Currency must be a 3-letter code (e.g. INR, USD)').optional().default('INR'),
  deadline: z
    .string()
    .datetime({ message: 'Invalid deadline date format. Must be an ISO 8601 string.' })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD or ISO string.'))
    .optional(),
  priority: z.nativeEnum(Priority, {
    errorMap: () => ({ message: 'Invalid priority. Expected LOW, MEDIUM, HIGH or CRITICAL.' }),
  }).optional().default(Priority.MEDIUM),
  recurrence: z.nativeEnum(Recurrence, {
    errorMap: () => ({ message: 'Invalid recurrence setting.' }),
  }).optional().default(Recurrence.NONE),
  source: z.nativeEnum(ObligationSource, {
    errorMap: () => ({ message: 'Invalid source. Expected GMAIL, TELEGRAM, CALENDAR, DOCUMENT or MANUAL.' }),
  }).optional().default(ObligationSource.MANUAL),
  sourceMessageId: z.string().uuid('Invalid sourceMessageId UUID').optional(),
});

export const updateObligationSchema = createObligationSchema
  .partial()
  .extend({
    status: z.nativeEnum(ObligationStatus, {
      errorMap: () => ({ message: 'Invalid status. Expected PENDING, COMPLETED or ARCHIVED.' }),
    }).optional(),
  })
  .omit({ sourceMessageId: true });

export const queryObligationsSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1, 'Page must be at least 1')),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100')),
  search: z.string().trim().optional(),
  status: z.nativeEnum(ObligationStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  category: z.nativeEnum(ObligationCategory).optional(),
  source: z.nativeEnum(ObligationSource).optional(),
  deadlineFrom: z.string().optional(),
  deadlineTo: z.string().optional(),
  due: z.enum(['today', 'week', 'month', 'overdue']).optional(),
  sortBy: z
    .enum(['deadline', 'amount', 'priority', 'createdAt', 'updatedAt', 'title'])
    .optional()
    .default('deadline'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const extractObligationTextSchema = z.object({
  text: z.string().trim().min(3, 'Text is required for obligation extraction').max(10000, 'Text exceeds 10,000 characters limit'),
});

export const createObligationFromTextSchema = z.object({
  text: z.string().trim().min(3, 'Text is required for obligation extraction').max(10000, 'Text exceeds 10,000 characters limit'),
  source: z.nativeEnum(ObligationSource, {
    errorMap: () => ({ message: 'Invalid source. Expected GMAIL, TELEGRAM, CALENDAR, DOCUMENT or MANUAL.' }),
  }).optional().default(ObligationSource.MANUAL),
  sourceMessageId: z.string().uuid('Invalid sourceMessageId UUID').optional(),
});

export const validate = (schema: z.ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map((e) => e.message).join('; ');
        res.status(400).json({
          success: false,
          message,
        });
        return;
      }
      next(error);
    }
  };
};
