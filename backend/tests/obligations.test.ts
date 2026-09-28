import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/services/obligations.service.js';

async function runTests() {
  console.log('==================================================');
  console.log('Running Obliqo Phase 2 API Test Suite');
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

  // Check database connectivity first
  let dbAvailable = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbAvailable = true;
  } catch {
    console.log('[INFO] Database offline - testing validation & error handlers via HTTP API server.');
  }

  // 1. GET /api/health
  await assertTest('1. GET /api/health should return 200 success', async () => {
    const res = await request(app).get('/api/health');
    if (res.status !== 200 || !res.body.success) {
      throw new Error(`Unexpected status ${res.status}: ${JSON.stringify(res.body)}`);
    }
  });

  // 2. Invalid Input Validation - POST /api/obligations with invalid priority
  await assertTest('2. POST /api/obligations should reject invalid priority (HTTP 400)', async () => {
    const res = await request(app).post('/api/obligations').send({
      title: 'Test Insurance',
      priority: 'SUPER_HIGH',
    });
    if (res.status !== 400 || res.body.success !== false) {
      throw new Error(`Expected status 400, got ${res.status}: ${JSON.stringify(res.body)}`);
    }
  });

  // 3. Invalid Input Validation - POST /api/obligations missing title
  await assertTest('3. POST /api/obligations should reject empty title (HTTP 400)', async () => {
    const res = await request(app).post('/api/obligations').send({
      description: 'Missing title',
    });
    if (res.status !== 400 || res.body.success !== false) {
      throw new Error(`Expected status 400, got ${res.status}: ${JSON.stringify(res.body)}`);
    }
  });

  // 4. Invalid Input Validation - GET /api/obligations invalid limit (> 100)
  await assertTest('4. GET /api/obligations should reject limit > 100 (HTTP 400)', async () => {
    const res = await request(app).get('/api/obligations?limit=500');
    if (res.status !== 400 || res.body.success !== false) {
      throw new Error(`Expected status 400, got ${res.status}: ${JSON.stringify(res.body)}`);
    }
  });

  // 5. Nonexistent Obligation - GET /api/obligations/nonexistent-id
  await assertTest('5. GET /api/obligations/nonexistent-id should return HTTP 404 (when DB live)', async () => {
    if (!dbAvailable) return;
    const res = await request(app).get('/api/obligations/00000000-0000-0000-0000-000000000000');
    if (res.status !== 404 || res.body.success !== false) {
      throw new Error(`Expected status 404, got ${res.status}: ${JSON.stringify(res.body)}`);
    }
  });

  if (dbAvailable) {
    let createdId: string;

    // 6. Create Obligation
    await assertTest('6. POST /api/obligations should create new obligation (HTTP 201)', async () => {
      const res = await request(app).post('/api/obligations').send({
        title: 'Property Tax Payment Test',
        description: 'Annual municipal property tax bill',
        category: 'TAX',
        amount: 12500,
        currency: 'INR',
        deadline: '2026-11-15',
        priority: 'HIGH',
        recurrence: 'YEARLY',
        source: 'MANUAL',
      });
      if (res.status !== 201 || !res.body.data?.id) {
        throw new Error(`Expected status 201, got ${res.status}: ${JSON.stringify(res.body)}`);
      }
      createdId = res.body.data.id;
    });

    // 7. Duplicate Detection
    await assertTest('7. POST /api/obligations should detect duplicate obligation', async () => {
      const res = await request(app).post('/api/obligations').send({
        title: 'Property Tax Payment Test',
        category: 'TAX',
        amount: 12500,
        deadline: '2026-11-15',
      });
      if (res.status !== 200 || !res.body.duplicate) {
        throw new Error(`Expected duplicate response, got ${res.status}: ${JSON.stringify(res.body)}`);
      }
    });

    // 8. GET all obligations
    await assertTest('8. GET /api/obligations should list obligations with pagination', async () => {
      const res = await request(app).get('/api/obligations?page=1&limit=10');
      if (res.status !== 200 || !Array.isArray(res.body.data.obligations)) {
        throw new Error(`Expected paginated obligations list, got: ${JSON.stringify(res.body)}`);
      }
    });

    // 9. GET single obligation by ID
    await assertTest('9. GET /api/obligations/:id should return obligation detail with relations', async () => {
      const res = await request(app).get(`/api/obligations/${createdId}`);
      if (res.status !== 200 || res.body.data.id !== createdId) {
        throw new Error(`Expected obligation details for ${createdId}, got: ${JSON.stringify(res.body)}`);
      }
    });

    // 10. Update obligation
    await assertTest('10. PATCH /api/obligations/:id should update obligation priority', async () => {
      const res = await request(app).patch(`/api/obligations/${createdId}`).send({
        priority: 'CRITICAL',
      });
      if (res.status !== 200 || res.body.data.priority !== 'CRITICAL') {
        throw new Error(`Expected updated priority CRITICAL, got: ${JSON.stringify(res.body)}`);
      }
    });

    // 11. Complete obligation (Idempotency test)
    await assertTest('11. POST /api/obligations/:id/complete should complete obligation idempotently', async () => {
      const res1 = await request(app).post(`/api/obligations/${createdId}/complete`);
      if (res1.status !== 200 || res1.body.data.status !== 'COMPLETED') {
        throw new Error(`Expected status COMPLETED, got: ${JSON.stringify(res1.body)}`);
      }

      // Repeat completion call (idempotency check)
      const res2 = await request(app).post(`/api/obligations/${createdId}/complete`);
      if (res2.status !== 200 || res2.body.data.status !== 'COMPLETED') {
        throw new Error(`Expected idempotent status COMPLETED, got: ${JSON.stringify(res2.body)}`);
      }
    });

    // 12. Soft Archive obligation
    await assertTest('12. POST /api/obligations/:id/archive should soft archive obligation', async () => {
      const res = await request(app).post(`/api/obligations/${createdId}/archive`);
      if (res.status !== 200 || res.body.data.status !== 'ARCHIVED') {
        throw new Error(`Expected status ARCHIVED, got: ${JSON.stringify(res.body)}`);
      }
    });

    // 13. Search filter
    await assertTest('13. GET /api/obligations?search=Property should find created obligation', async () => {
      const res = await request(app).get('/api/obligations?search=Property');
      if (res.status !== 200 || res.body.data.obligations.length === 0) {
        throw new Error(`Expected search results for 'Property', got: ${JSON.stringify(res.body)}`);
      }
    });

    // 14. GET Summary
    await assertTest('14. GET /api/obligations/summary should return dashboard counts', async () => {
      const res = await request(app).get('/api/obligations/summary');
      if (res.status !== 200 || res.body.data.dueToday === undefined) {
        throw new Error(`Expected summary metrics, got: ${JSON.stringify(res.body)}`);
      }
    });
  }

  console.log('\n==================================================');
  console.log(`Test Suite Complete. Passed: ${passed}, Failed: ${failed}`);
  console.log('==================================================');

  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
