import { AIProvider, AICompletionOptions } from './ai-provider.interface.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private defaultModel: string;
  private defaultTimeoutMs: number;

  constructor() {
    this.baseUrl = env.OLLAMA_BASE_URL.replace(/\/$/, '');
    this.defaultModel = env.OLLAMA_MODEL;
    this.defaultTimeoutMs = env.OLLAMA_TIMEOUT_MS;
  }

  async generateStructuredCompletion(
    prompt: string,
    options?: AICompletionOptions
  ): Promise<string> {
    const model = options?.model || this.defaultModel;
    const timeoutMs = options?.timeoutMs || this.defaultTimeoutMs;
    const systemPrompt = options?.systemPrompt || '';

    logger.info(`[Obliqo AI] Sending extraction prompt to Ollama (${model}) at ${this.baseUrl}`);

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          system: systemPrompt,
          format: 'json',
          stream: false,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));

      if (!response.ok) {
        logger.error(`[Obliqo AI] Ollama HTTP error: ${response.status} ${response.statusText}`);
        throw new Error('AI extraction service returned non-success response');
      }

      const data = (await response.json()) as { response?: string };

      if (!data.response) {
        logger.error('[Obliqo AI] Ollama returned empty response payload');
        throw new Error('AI extraction service returned empty response');
      }

      return data.response.trim();
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error(`[Obliqo AI] Ollama request timed out after ${timeoutMs}ms`);
        throw new Error('AI extraction timed out');
      }

      logger.error('[Obliqo AI] Failed to communicate with Ollama service:', error);
      throw new Error('AI extraction is temporarily unavailable');
    }
  }
}
