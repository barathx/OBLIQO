import request from 'supertest';
import app from '../src/app.js';
import { ObligationExtractorService } from '../src/services/ai/obligation-extractor.service.js';
import { MockAIProvider } from '../src/services/ai/mock-ai.service.js';
import { AIProvider } from '../src/services/ai/ai-provider.interface.js';

async function runAITests() {
  console.log('==================================================');
  console.log('Running Obliqo Phase 3 AI Extraction Engine Tests');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  async function assertTest(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[FAIL] ${name}:`, errorMsg);
      failed++;
    }
  }

  const mockProvider = new MockAIProvider();
  const extractor = new ObligationExtractorService(mockProvider);
  const refDate = new Date('2026-09-29T00:00:00Z');

  // TEST 1: Insurance obligation
  await assertTest('TEST 1: Extract Insurance Renewal (₹8,500, Oct 5, 2026)', async () => {
    const input = 'Your car insurance policy expires on October 5, 2026. Renewal amount: ₹8,500.';
    const result = await extractor.extractObligationFromText(input, refDate);

    if (!result.isObligation || !result.obligation) {
      throw new Error('Expected isObligation to be true');
    }
    const ob = result.obligation;
    if (ob.category !== 'INSURANCE') throw new Error(`Expected category INSURANCE, got ${ob.category}`);
    if (ob.amount !== 8500) throw new Error(`Expected amount 8500, got ${ob.amount}`);
    if (ob.currency !== 'INR') throw new Error(`Expected currency INR, got ${ob.currency}`);
    if (ob.deadline !== '2026-10-05') throw new Error(`Expected deadline 2026-10-05, got ${ob.deadline}`);
  });

  // TEST 2: Electricity bill due today
  await assertTest('TEST 2: Extract Electricity Bill due today', async () => {
    const input = 'Your electricity bill of ₹2,450 is due today.';
    const result = await extractor.extractObligationFromText(input, refDate);

    if (!result.isObligation || !result.obligation) {
      throw new Error('Expected isObligation to be true');
    }
    const ob = result.obligation;
    if (ob.category !== 'BILL') throw new Error(`Expected category BILL, got ${ob.category}`);
    if (ob.amount !== 2450) throw new Error(`Expected amount 2450, got ${ob.amount}`);
    if (ob.deadline !== '2026-09-29') throw new Error(`Expected deadline 2026-09-29, got ${ob.deadline}`);
  });

  // TEST 3: Subscription monthly renewal
  await assertTest('TEST 3: Extract Netflix Subscription (Monthly, ₹649)', async () => {
    const input = 'Netflix subscription renews automatically every month for ₹649.';
    const result = await extractor.extractObligationFromText(input, refDate);

    if (!result.isObligation || !result.obligation) {
      throw new Error('Expected isObligation to be true');
    }
    const ob = result.obligation;
    if (ob.category !== 'SUBSCRIPTION') throw new Error(`Expected category SUBSCRIPTION, got ${ob.category}`);
    if (ob.amount !== 649) throw new Error(`Expected amount 649, got ${ob.amount}`);
    if (ob.recurrence !== 'MONTHLY') throw new Error(`Expected recurrence MONTHLY, got ${ob.recurrence}`);
  });

  // TEST 4: Non-obligation message
  await assertTest('TEST 4: Non-obligation text ("coming to class tomorrow?")', async () => {
    const input = 'Hey, are you coming to class tomorrow?';
    const result = await extractor.extractObligationFromText(input, refDate);

    if (result.isObligation !== false) {
      throw new Error('Expected isObligation to be false for casual message');
    }
  });

  // TEST 5: Driving licence document expiration
  await assertTest('TEST 5: Extract Driving Licence Renewal (DOCUMENT, Nov 3, 2026)', async () => {
    const input = 'Your driving licence expires on November 3, 2026.';
    const result = await extractor.extractObligationFromText(input, refDate);

    if (!result.isObligation || !result.obligation) {
      throw new Error('Expected isObligation to be true');
    }
    const ob = result.obligation;
    if (ob.category !== 'DOCUMENT') throw new Error(`Expected category DOCUMENT, got ${ob.category}`);
    if (ob.deadline !== '2026-11-03') throw new Error(`Expected deadline 2026-11-03, got ${ob.deadline}`);
  });

  // TEST 6: Malformed AI JSON response handling
  await assertTest('TEST 6: Malformed AI JSON response handling', async () => {
    const brokenProvider: AIProvider = {
      generateStructuredCompletion: async () => 'INVALID_NON_JSON_PROSE',
    };
    const brokenExtractor = new ObligationExtractorService(brokenProvider);

    try {
      await brokenExtractor.extractObligationFromText('Some obligation text');
      throw new Error('Expected error for invalid JSON payload');
    } catch (err) {
      if (err instanceof Error && err.message.includes('AI extraction returned invalid JSON payload')) {
        // Success
      } else {
        throw err;
      }
    }
  });

  // TEST 7: AI Service Unavailable error handling
  await assertTest('TEST 7: Ollama unavailable error handling', async () => {
    const failingProvider: AIProvider = {
      generateStructuredCompletion: async () => {
        throw new Error('AI extraction is temporarily unavailable');
      },
    };
    const failingExtractor = new ObligationExtractorService(failingProvider);

    try {
      await failingExtractor.extractObligationFromText('Some text');
      throw new Error('Expected error when AI service is unavailable');
    } catch (err) {
      if (err instanceof Error && err.message.includes('AI extraction is temporarily unavailable')) {
        // Success
      } else {
        throw err;
      }
    }
  });

  // TEST 8: HTTP Endpoint POST /api/ai/extract-obligation (validation check)
  await assertTest('TEST 8: POST /api/ai/extract-obligation should reject text < 3 chars (HTTP 400)', async () => {
    const res = await request(app).post('/api/ai/extract-obligation').send({
      text: 'hi',
    });
    if (res.status !== 400 || res.body.success !== false) {
      throw new Error(`Expected status 400 for short text, got ${res.status}: ${JSON.stringify(res.body)}`);
    }
  });

  console.log('\n==================================================');
  console.log(`Phase 3 Test Suite Complete. Passed: ${passed}, Failed: ${failed}`);
  console.log('==================================================');

  if (failed > 0) process.exit(1);
}

runAITests().catch((err) => {
  console.error('Fatal AI test runner failure:', err);
  process.exit(1);
});
