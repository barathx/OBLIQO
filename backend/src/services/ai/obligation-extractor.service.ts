import { z } from 'zod';
import {
  Priority,
  ObligationCategory,
  Recurrence,
} from '@prisma/client';
import { AIProvider } from './ai-provider.interface.js';
import { OllamaProvider } from './ollama.service.js';
import { OBLIGATION_EXTRACTION_SYSTEM_PROMPT } from './ai-prompts.js';
import { logger } from '../../utils/logger.js';

const safeNullableEnum = <T extends Record<string, string>>(enumObj: T) =>
  z.preprocess(
    (val) => (val === 'null' || val === '' || val === null || val === undefined ? null : val),
    z.nativeEnum(enumObj).nullable().optional()
  );

export const extractedObligationSchema = z.object({
  title: z
    .preprocess(
      (val) => (val === null || val === undefined ? 'Obligation Notice' : String(val)),
      z.string().trim().min(1)
    )
    .default('Obligation Notice'),
  description: z.preprocess(
    (val) => (val === 'null' || val === '' || val === null || val === undefined ? null : String(val)),
    z.string().trim().nullable().optional()
  ),
  category: safeNullableEnum(ObligationCategory),
  amount: z.preprocess((val) => {
    if (val === 'null' || val === '' || val === null || val === undefined) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  }, z.number().nonnegative().nullable().optional()),
  currency: z.preprocess(
    (val) => (val === 'null' || val === '' || val === null || val === undefined ? null : String(val)),
    z.string().trim().nullable().optional()
  ),
  deadline: z.preprocess(
    (val) => (val === 'null' || val === '' || val === null || val === undefined ? null : String(val)),
    z.string().trim().nullable().optional()
  ),
  priority: safeNullableEnum(Priority),
  recurrence: safeNullableEnum(Recurrence),
});

export const aiExtractionResponseSchema = z.object({
  isObligation: z.boolean(),
  reason: z.string().optional(),
  obligation: extractedObligationSchema.nullable().optional(),
});

export type ExtractedObligation = z.infer<typeof extractedObligationSchema>;

export class ObligationExtractorService {
  private defaultProvider: AIProvider;

  constructor(provider?: AIProvider) {
    this.defaultProvider = provider || new OllamaProvider();
  }

  /**
   * Currency symbol & string normalizer
   */
  static normalizeCurrency(currencyStr?: string | null): string {
    if (!currencyStr) return 'INR';
    const cleaned = currencyStr.trim().toUpperCase();

    if (cleaned === '₹' || cleaned.includes('INR') || cleaned.includes('RS') || cleaned.includes('RUPEE')) {
      return 'INR';
    }
    if (cleaned === '$' || cleaned.includes('USD') || cleaned.includes('DOLLAR')) {
      return 'USD';
    }
    if (cleaned === '€' || cleaned.includes('EUR') || cleaned.includes('EURO')) {
      return 'EUR';
    }
    if (cleaned === '£' || cleaned.includes('GBP') || cleaned.includes('POUND')) {
      return 'GBP';
    }
    return cleaned.length === 3 ? cleaned : 'INR';
  }

  /**
   * ISO Date validator and normalizer
   */
  static normalizeDeadline(deadlineStr?: string | null): string | undefined {
    if (!deadlineStr || deadlineStr.trim() === '') return undefined;
    const trimmed = deadlineStr.trim();

    // Check YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) return trimmed;
    }

    // Check full ISO date string
    const parsedDate = new Date(trimmed);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split('T')[0];
    }

    logger.warn(`[Obliqo AI] Could not normalize deadline date: "${deadlineStr}". Setting deadline to undefined.`);
    return undefined;
  }

  /**
   * Main text-to-obligation extraction pipeline
   */
  async extractObligationFromText(
    text: string,
    referenceDate: Date = new Date(),
    providerOverride?: AIProvider
  ) {
    const provider = providerOverride || this.defaultProvider;
    const refDateISO = referenceDate.toISOString().split('T')[0];

    const systemPrompt = OBLIGATION_EXTRACTION_SYSTEM_PROMPT.replace(
      /\{\{REFERENCE_DATE\}\}/g,
      refDateISO
    );

    const prompt = `Analyze the following input text for an obligation:\n\n"${text}"`;

    logger.info('[Obliqo AI] Extraction started');
    const rawCompletion = await provider.generateStructuredCompletion(prompt, {
      systemPrompt,
    });

    // Clean any accidental markdown codeblock wrappers (e.g. ```json ... ```)
    const sanitizedJson = rawCompletion
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    let parsedObj: unknown;
    try {
      parsedObj = JSON.parse(sanitizedJson);
    } catch (parseErr) {
      logger.error('[Obliqo AI] Failed to parse model JSON completion:', parseErr);
      throw new Error('AI extraction returned invalid JSON payload');
    }

    // Zod validation against expected output schema
    const validationResult = aiExtractionResponseSchema.safeParse(parsedObj);
    if (!validationResult.success) {
      logger.error(
        '[Obliqo AI] Zod schema validation failed:',
        JSON.stringify(validationResult.error.flatten(), null, 2)
      );
      throw new Error('AI extraction payload schema mismatch');
    }

    const { isObligation, reason, obligation } = validationResult.data;

    if (!isObligation || !obligation) {
      logger.info('[Obliqo AI] Extraction completed: No actionable obligation detected');
      return {
        isObligation: false,
        reason: reason || 'No actionable obligation detected',
      };
    }

    // Normalize extracted fields
    const normalizedObligation = {
      title: obligation.title || 'Obligation Notice',
      description: obligation.description || undefined,
      category: obligation.category || ObligationCategory.OTHER,
      amount: obligation.amount !== null && obligation.amount !== undefined ? obligation.amount : undefined,
      currency: ObligationExtractorService.normalizeCurrency(obligation.currency),
      deadline: ObligationExtractorService.normalizeDeadline(obligation.deadline),
      priority: obligation.priority || Priority.MEDIUM,
      recurrence: obligation.recurrence || Recurrence.NONE,
    };

    logger.info(`[Obliqo AI] Extraction completed successfully: "${normalizedObligation.title}"`);

    return {
      isObligation: true,
      obligation: normalizedObligation,
    };
  }
}
