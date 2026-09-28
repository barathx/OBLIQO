export interface AICompletionOptions {
  model?: string;
  timeoutMs?: number;
  systemPrompt?: string;
}

export interface AIProvider {
  /**
   * Generates structured text completion from LLM provider
   */
  generateStructuredCompletion(prompt: string, options?: AICompletionOptions): Promise<string>;
}
