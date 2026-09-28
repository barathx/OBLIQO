import { AIProvider, AICompletionOptions } from './ai-provider.interface.js';

export class MockAIProvider implements AIProvider {
  private mockResponses: Map<string, string> = new Map();
  private defaultResponse: string;

  constructor(defaultResponse?: string) {
    this.defaultResponse =
      defaultResponse ||
      JSON.stringify({
        isObligation: false,
        reason: 'No actionable obligation detected',
      });
  }

  /**
   * Register a custom mock response key/match for deterministic tests
   */
  setMockResponse(pattern: string, jsonResponse: string) {
    this.mockResponses.set(pattern.toLowerCase(), jsonResponse);
  }

  async generateStructuredCompletion(
    prompt: string,
    _options?: AICompletionOptions
  ): Promise<string> {
    const promptLower = prompt.toLowerCase();

    for (const [key, response] of this.mockResponses.entries()) {
      if (promptLower.includes(key)) {
        return response;
      }
    }

    // Default mock response matchers for prompt patterns
    if (promptLower.includes('car insurance') || promptLower.includes('expires on october 5, 2026')) {
      return JSON.stringify({
        isObligation: true,
        obligation: {
          title: 'Car Insurance Renewal',
          description: 'Car insurance policy expiration and renewal',
          category: 'INSURANCE',
          amount: 8500,
          currency: 'INR',
          deadline: '2026-10-05',
          priority: 'HIGH',
          recurrence: 'YEARLY',
        },
      });
    }

    if (promptLower.includes('electricity bill') && promptLower.includes('due today')) {
      return JSON.stringify({
        isObligation: true,
        obligation: {
          title: 'Electricity Bill',
          description: 'Electricity utility bill due today',
          category: 'BILL',
          amount: 2450,
          currency: 'INR',
          deadline: '2026-09-29',
          priority: 'CRITICAL',
          recurrence: 'MONTHLY',
        },
      });
    }

    if (promptLower.includes('netflix subscription') || promptLower.includes('renews automatically')) {
      return JSON.stringify({
        isObligation: true,
        obligation: {
          title: 'Netflix Subscription',
          description: 'Monthly streaming service auto-renewal',
          category: 'SUBSCRIPTION',
          amount: 649,
          currency: 'INR',
          deadline: null,
          priority: 'LOW',
          recurrence: 'MONTHLY',
        },
      });
    }

    if (promptLower.includes('driving licence') || promptLower.includes('licence expires')) {
      return JSON.stringify({
        isObligation: true,
        obligation: {
          title: 'Driving Licence Renewal',
          description: 'Driver license expiration date',
          category: 'DOCUMENT',
          amount: null,
          currency: null,
          deadline: '2026-11-03',
          priority: 'HIGH',
          recurrence: 'NONE',
        },
      });
    }

    if (promptLower.includes('coming to class tomorrow') || promptLower.includes('hey, are you')) {
      return JSON.stringify({
        isObligation: false,
        reason: 'No actionable obligation detected',
      });
    }

    return this.defaultResponse;
  }
}
