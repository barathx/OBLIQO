import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_URL = process.env.OBLIQO_BACKEND_URL || 'http://localhost:3000';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/obliqo/message';

async function runPhase5MatrixTests() {
  console.log('==================================================');
  console.log('Running Obliqo Phase 5 Source Integration Tests');
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

  // Check if n8n webhook is live or execute direct normalizer workflow logic
  let isN8nLive = false;
  try {
    const res = await fetch(N8N_WEBHOOK_URL, { method: 'POST' });
    if (res.status !== 404) isN8nLive = true;
  } catch {
    console.log(`[INFO] n8n Webhook at ${N8N_WEBHOOK_URL} is offline. Testing normalization & backend integration directly.`);
  }

  const seenExternalIds = new Set<string>();

  // Normalizer & HTML Stripper helper
  function normalizePayload(payload: Record<string, unknown>) {
    const allowedSources = ['GMAIL', 'TELEGRAM', 'CALENDAR', 'DOCUMENT', 'MANUAL'];
    const source = String(payload.source || 'MANUAL').toUpperCase();
    let content = String(payload.content || '').trim();

    // Strip HTML markup if present
    if (content.includes('<') && content.includes('>')) {
      content = content
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    if (!content || content.length < 3) {
      return {
        isValid: false,
        error: 'Invalid message payload: missing or empty content',
      };
    }

    if (!allowedSources.includes(source)) {
      return {
        isValid: false,
        error: `Invalid message payload: source must be one of ${allowedSources.join(', ')}`,
      };
    }

    return {
      isValid: true,
      normalized: {
        source,
        externalId: (payload.externalId as string) || undefined,
        sender: (payload.sender as string) || undefined,
        subject: (payload.subject as string) || undefined,
        content,
        timestamp: (payload.timestamp as string) || new Date().toISOString(),
        metadata: (payload.metadata as Record<string, unknown>) || {},
      },
    };
  }

  // Process message through full workflow pipeline
  async function processMessagePayload(payload: Record<string, unknown>) {
    if (isN8nLive) {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    }

    // Direct normalizer logic
    const norm = normalizePayload(payload);
    if (!norm.isValid || !norm.normalized) {
      return {
        success: false,
        processed: false,
        created: false,
        message: norm.error || 'Invalid message payload',
      };
    }

    const { source, externalId, content } = norm.normalized;

    // Duplicate check using externalId tracking
    if (externalId && seenExternalIds.has(externalId)) {
      return {
        success: true,
        processed: true,
        created: false,
        duplicate: true,
        message: 'Duplicate obligation detected',
      };
    }

    // Call Obliqo Backend AI Extraction
    let extractRes: Response;
    try {
      extractRes = await fetch(`${BACKEND_URL}/api/ai/extract-obligation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      });
    } catch {
      return {
        success: false,
        processed: false,
        created: false,
        message: 'Obliqo backend is unavailable',
      };
    }

    const extractData = (await extractRes.json()) as { success: boolean; data?: { isObligation: boolean; reason?: string } };

    if (!extractData.success || !extractData.data?.isObligation) {
      return {
        success: true,
        processed: false,
        created: false,
        message: 'No actionable obligation detected',
        reason: extractData.data?.reason || 'No actionable obligation detected',
      };
    }

    // Call Obliqo Backend Create Obligation
    const createRes = await fetch(`${BACKEND_URL}/api/ai/create-obligation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: content,
        source,
        sourceMessageId: externalId,
      }),
    });

    const createData = (await createRes.json()) as { success: boolean; duplicate?: boolean; data?: unknown; message?: string };

    if (externalId) {
      seenExternalIds.add(externalId);
    }

    if (createData.duplicate) {
      return {
        success: true,
        processed: true,
        created: false,
        duplicate: true,
        message: 'Duplicate obligation detected',
        obligation: createData.data,
      };
    }

    return {
      success: true,
      processed: true,
      created: true,
      duplicate: false,
      message: 'Obligation created successfully',
      obligation: createData.data,
    };
  }

  // Helper to load test JSON payload
  const testDataDir = path.resolve(__dirname, '../test-data');
  const loadPayload = (file: string) => JSON.parse(fs.readFileSync(path.join(testDataDir, file), 'utf-8'));

  console.log('--- GMAIL SOURCE ADAPTER TESTS ---');

  // TEST 1 — Gmail Insurance Renewal
  await assertTest('TEST 1 [GMAIL]: Insurance Renewal Notice', async () => {
    const payload = loadPayload('01-gmail-insurance.json');
    const result = (await processMessagePayload(payload)) as { success: boolean; created?: boolean; duplicate?: boolean };
    if (!result.success || (!result.created && !result.duplicate)) {
      throw new Error(`Expected obligation created, got: ${JSON.stringify(result)}`);
    }
  });

  // TEST 2 — Gmail Electricity Bill
  await assertTest('TEST 2 [GMAIL]: Electricity Bill Statement', async () => {
    const payload = loadPayload('02-gmail-bill.json');
    const result = (await processMessagePayload(payload)) as { success: boolean; created?: boolean };
    if (!result.success) throw new Error(`Expected success, got: ${JSON.stringify(result)}`);
  });

  // TEST 3 — Gmail Normal Chat (Lunch)
  await assertTest('TEST 3 [GMAIL]: Casual Lunch Email (Non-Obligation)', async () => {
    const payload = loadPayload('07-gmail-normal.json');
    const result = (await processMessagePayload(payload)) as { success: boolean; created: boolean; processed: boolean };
    if (!result.success || result.created !== false || result.processed !== false) {
      throw new Error(`Expected created: false, processed: false, got: ${JSON.stringify(result)}`);
    }
  });

  // TEST 4 — Gmail Duplicate Email
  await assertTest('TEST 4 [GMAIL]: Duplicate Insurance Email', async () => {
    const payload = loadPayload('06-duplicate.json');
    const result = (await processMessagePayload(payload)) as { success: boolean; created: boolean; duplicate?: boolean };
    if (!result.success || result.duplicate !== true || result.created !== false) {
      throw new Error(`Expected duplicate: true, created: false, got: ${JSON.stringify(result)}`);
    }
  });

  // TEST 5 — Gmail HTML Email with Markup
  await assertTest('TEST 5 [GMAIL]: HTML Email Body Normalization & Extraction', async () => {
    const payload = loadPayload('08-gmail-html.json');
    const result = (await processMessagePayload(payload)) as { success: boolean; created?: boolean };
    if (!result.success) throw new Error(`Expected HTML stripped and extracted successfully, got: ${JSON.stringify(result)}`);
  });

  console.log('\n--- TELEGRAM SOURCE ADAPTER TESTS ---');

  // TEST 6 — Telegram Vehicle Service
  await assertTest('TEST 6 [TELEGRAM]: Vehicle Service Due Notice', async () => {
    const payload = loadPayload('03-telegram-service.json');
    const result = (await processMessagePayload(payload)) as { success: boolean; created?: boolean };
    if (!result.success) throw new Error(`Expected success, got: ${JSON.stringify(result)}`);
  });

  // TEST 7 — Telegram Normal Chat
  await assertTest('TEST 7 [TELEGRAM]: Casual Chat Message (Non-Obligation)', async () => {
    const payload = loadPayload('05-non-obligation.json');
    const result = (await processMessagePayload(payload)) as { success: boolean; created: boolean; processed: boolean };
    if (!result.success || result.created !== false || result.processed !== false) {
      throw new Error(`Expected created: false, processed: false, got: ${JSON.stringify(result)}`);
    }
  });

  // TEST 8 — Telegram Duplicate Message
  await assertTest('TEST 8 [TELEGRAM]: Duplicate Vehicle Service Message', async () => {
    const payload = loadPayload('09-telegram-duplicate.json');
    const result = (await processMessagePayload(payload)) as { success: boolean; created: boolean; duplicate?: boolean };
    if (!result.success || result.duplicate !== true || result.created !== false) {
      throw new Error(`Expected duplicate: true, created: false, got: ${JSON.stringify(result)}`);
    }
  });

  // TEST 9 — Telegram Unsupported Message Type (Sticker/Empty)
  await assertTest('TEST 9 [TELEGRAM]: Unsupported Sticker/Non-Text Message', async () => {
    const payload = loadPayload('10-telegram-unsupported.json');
    const result = (await processMessagePayload(payload)) as { success: boolean; created: boolean; processed: boolean };
    if (result.success !== false || result.created !== false) {
      throw new Error(`Expected validation failure for empty/sticker payload, got: ${JSON.stringify(result)}`);
    }
  });

  console.log('\n--- GOOGLE CALENDAR SOURCE ADAPTER TESTS ---');

  // TEST 10 — Calendar License Renewal
  await assertTest('TEST 10 [CALENDAR]: Driving License Renewal Deadline Event', async () => {
    const payload = loadPayload('04-calendar-document.json');
    const result = (await processMessagePayload(payload)) as { success: boolean; created?: boolean };
    if (!result.success) throw new Error(`Expected success, got: ${JSON.stringify(result)}`);
  });

  // TEST 11 — Calendar Normal Team Sync
  await assertTest('TEST 11 [CALENDAR]: Weekly Team Sync Event (Non-Obligation)', async () => {
    const payload = loadPayload('11-calendar-meeting.json');
    const result = (await processMessagePayload(payload)) as { success: boolean; created: boolean; processed: boolean };
    if (!result.success || result.created !== false || result.processed !== false) {
      throw new Error(`Expected created: false, processed: false, got: ${JSON.stringify(result)}`);
    }
  });

  // TEST 12 — Calendar Duplicate Event
  await assertTest('TEST 12 [CALENDAR]: Duplicate Calendar Event', async () => {
    const payload = loadPayload('12-calendar-duplicate.json');
    const result = (await processMessagePayload(payload)) as { success: boolean; created: boolean; duplicate?: boolean };
    if (!result.success || result.duplicate !== true || result.created !== false) {
      throw new Error(`Expected duplicate: true, created: false, got: ${JSON.stringify(result)}`);
    }
  });

  console.log('\n--- SYSTEM & ERROR HANDLING TESTS ---');

  // TEST 13 — Invalid Source Enum
  await assertTest('TEST 13 [SYSTEM]: Invalid Source Enum Rejection', async () => {
    const result = (await processMessagePayload({ source: 'SLACK', content: 'Some bill notice' })) as { success: boolean };
    if (result.success !== false) throw new Error(`Expected rejection for invalid source SLACK, got: ${JSON.stringify(result)}`);
  });

  // TEST 14 — Missing Content
  await assertTest('TEST 14 [SYSTEM]: Missing Content Rejection', async () => {
    const result = (await processMessagePayload({ source: 'GMAIL', content: '' })) as { success: boolean };
    if (result.success !== false) throw new Error(`Expected rejection for missing content, got: ${JSON.stringify(result)}`);
  });

  console.log('\n==================================================');
  console.log(`Phase 5 Integration Test Matrix Complete. Passed: ${passed}, Failed: ${failed}`);
  console.log('==================================================');

  if (failed > 0) process.exit(1);
}

runPhase5MatrixTests().catch((err) => {
  console.error('Fatal Phase 5 test runner failure:', err);
  process.exit(1);
});
