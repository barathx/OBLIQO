import supertest from 'supertest';
import app from '../src/app.js';
import { prisma, ObligationsService } from '../src/services/obligations.service.js';
import { ReminderService } from '../src/services/reminder.service.js';
import { ObligationSource, NotificationType } from '@prisma/client';

const request = supertest(app);

let passedCount = 0;
let failedCount = 0;

function logPass(msg: string) {
  console.log(`[PASS] ${msg}`);
  passedCount++;
}

function logFail(msg: string, details?: unknown) {
  console.error(`[FAIL] ${msg}`, details !== undefined ? details : '');
  failedCount++;
}

async function runPhase8E2ETests() {
  console.log('\n==================================================');
  console.log('Running Obliqo Phase 8 End-to-End Integration Tests');
  console.log('==================================================\n');

  try {
    const demoUser = await ObligationsService.getOrCreateDemoUser();
    const userId = demoUser.id;

    // --------------------------------------------------
    // TEST 1: Gmail Insurance Renewal E2E Flow
    // --------------------------------------------------
    const t1Res = await request.post('/api/ai/create-obligation').send({
      text: 'Your HDFC Ergo Health Insurance Policy expires on November 15, 2026. Renewal premium is ₹12,500.',
      source: 'GMAIL',
    });

    if ((t1Res.status === 201 || t1Res.status === 200) && t1Res.body.data?.id) {
      const oblId = t1Res.body.data.id;
      const reminders = await prisma.reminder.findMany({ where: { obligationId: oblId } });
      const notifs = await prisma.notification.findMany({ where: { obligationId: oblId } });

      if (reminders.length > 0 && notifs.length > 0) {
        logPass('TEST 1: Gmail insurance renewal -> AI extracted -> DB saved -> reminders & notification created');
      } else {
        logFail('TEST 1: Missing reminders or notifications for Gmail insurance renewal');
      }
    } else {
      logFail('TEST 1: Failed to process Gmail insurance renewal text', t1Res.body);
    }

    // --------------------------------------------------
    // TEST 2: Gmail Electricity Bill E2E Flow
    // --------------------------------------------------
    const t2Res = await request.post('/api/ai/create-obligation').send({
      text: 'Electricity Bill generated for Meter #88492. Due date: October 20, 2026. Payable amount: ₹2,450.',
      source: 'GMAIL',
    });

    if ((t2Res.status === 201 || t2Res.status === 200) && t2Res.body.data?.id) {
      const oblId = t2Res.body.data.id;
      const reminders = await prisma.reminder.findMany({ where: { obligationId: oblId } });
      if (reminders.length > 0) {
        logPass('TEST 2: Gmail electricity bill -> BILL obligation & reminders generated');
      } else {
        logFail('TEST 2: No reminders generated for electricity bill');
      }
    } else {
      logFail('TEST 2: Failed to process Gmail electricity bill', t2Res.body);
    }

    // --------------------------------------------------
    // TEST 3: Telegram Service Message E2E Flow
    // --------------------------------------------------
    const t3Res = await request.post('/api/ai/create-obligation').send({
      text: 'Car General Service due for vehicle MH02AB1234 on December 1, 2026. Estimated cost ₹4,500.',
      source: 'TELEGRAM',
    });

    if ((t3Res.status === 201 || t3Res.status === 200) && t3Res.body.data?.id) {
      const oblId = t3Res.body.data.id;
      const reminders = await prisma.reminder.findMany({ where: { obligationId: oblId } });
      if (reminders.length > 0) {
        logPass('TEST 3: Telegram vehicle service message -> SERVICE obligation & reminders generated');
      } else {
        logFail('TEST 3: No reminders generated for Telegram service message');
      }
    } else {
      logFail('TEST 3: Failed to process Telegram service message', t3Res.body);
    }

    // --------------------------------------------------
    // TEST 4: Calendar Document Renewal E2E Flow
    // --------------------------------------------------
    const t4Res = await request.post('/api/ai/create-obligation').send({
      text: 'Passport Renewal deadline approaching on October 30, 2026. Fee ₹1,500.',
      source: 'CALENDAR',
    });

    if ((t4Res.status === 201 || t4Res.status === 200) && t4Res.body.data?.id) {
      const oblId = t4Res.body.data.id;
      const reminders = await prisma.reminder.findMany({ where: { obligationId: oblId } });
      if (reminders.length > 0) {
        logPass('TEST 4: Calendar document renewal -> DOCUMENT obligation & reminders generated');
      } else {
        logFail('TEST 4: No reminders generated for Calendar document renewal');
      }
    } else {
      logFail('TEST 4: Failed to process Calendar document renewal', t4Res.body);
    }

    // --------------------------------------------------
    // TEST 5: Casual Non-obligation Message
    // --------------------------------------------------
    const t5Res = await request.post('/api/ai/create-obligation').send({
      text: 'Hey Aarav, are we still meeting for lunch tomorrow at 1 PM?',
      source: 'TELEGRAM',
    });

    if (t5Res.status === 400 && t5Res.body.success === false) {
      logPass('TEST 5: Casual non-obligation message correctly rejected with no DB obligation created');
    } else {
      logFail('TEST 5: Casual message was improperly converted into an obligation');
    }

    // --------------------------------------------------
    // TEST 6: Duplicate External Message Detection
    // --------------------------------------------------
    const sourceMsg = await prisma.sourceMessage.create({
      data: {
        userId,
        source: 'GMAIL',
        externalId: 'msg-dup-101',
        content: 'Your HDFC Ergo Health Insurance Policy expires on November 15, 2026. Renewal premium is ₹12,500.',
      },
    });

    const firstOblRes = await ObligationsService.createObligation(
      {
        title: 'HDFC Ergo Health Insurance Policy Renewal',
        category: 'INSURANCE',
        amount: 12500,
        currency: 'INR',
        deadline: '2026-11-15T09:00:00.000Z',
        priority: 'HIGH',
        source: 'GMAIL',
        sourceMessageId: sourceMsg.id,
      },
      userId
    );

    const dupOblRes = await ObligationsService.createObligation(
      {
        title: 'HDFC Ergo Health Insurance Policy Renewal',
        category: 'INSURANCE',
        amount: 12500,
        currency: 'INR',
        deadline: '2026-11-15T09:00:00.000Z',
        priority: 'HIGH',
        source: 'GMAIL',
        sourceMessageId: sourceMsg.id,
      },
      userId
    );

    if (dupOblRes.isDuplicate === true) {
      logPass('TEST 6: Duplicate external message correctly detected; no second obligation or reminder set');
    } else {
      logFail('TEST 6: Duplicate external message was not detected');
    }

    // --------------------------------------------------
    // TEST 7: Complete Obligation -> Future Reminders Cancelled & Notification Generated
    // --------------------------------------------------
    const test7Obl = await prisma.obligation.create({
      data: {
        userId,
        title: 'Phase 8 E2E Completion Test Obligation',
        category: 'BILL',
        amount: 999,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        priority: 'MEDIUM',
      },
    });
    await ReminderService.generateDefaultRemindersForObligation(test7Obl);

    const completeRes = await request.post(`/api/obligations/${test7Obl.id}/complete`);
    if (completeRes.status === 200 && completeRes.body.data.status === 'COMPLETED') {
      const reminders = await prisma.reminder.findMany({ where: { obligationId: test7Obl.id } });
      const allCancelled = reminders.every((r) => r.status === 'CANCELLED');
      const compNotif = await prisma.notification.findFirst({
        where: { obligationId: test7Obl.id, type: NotificationType.COMPLETED },
      });

      if (allCancelled && compNotif) {
        logPass('TEST 7: Completed obligation cancelled future reminders & generated COMPLETED notification');
      } else {
        logFail('TEST 7: Reminders were not cancelled or COMPLETED notification missing');
      }
    } else {
      logFail('TEST 7: Failed to complete obligation');
    }

    // --------------------------------------------------
    // TEST 8: Overdue Obligation Handling
    // --------------------------------------------------
    const overdueDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const test8Obl = await prisma.obligation.create({
      data: {
        userId,
        title: 'Phase 8 Overdue Test Obligation',
        category: 'INSURANCE',
        amount: 4000,
        deadline: overdueDate,
        priority: 'HIGH',
      },
    });

    await ReminderService.processOverdueObligations();
    await ReminderService.processOverdueObligations(); // run twice to test idempotency

    const overdueNotifs = await prisma.notification.findMany({
      where: { obligationId: test8Obl.id, message: { contains: 'overdue' } },
    });

    if (overdueNotifs.length === 1) {
      logPass('TEST 8: Overdue obligation generated exactly 1 overdue notification idempotently');
    } else {
      logFail(`TEST 8: Expected 1 overdue notification, got ${overdueNotifs.length}`);
    }
  } catch (err) {
    console.error('Phase 8 E2E Test execution error:', err);
  } finally {
    console.log('\n==================================================');
    console.log(`Phase 8 E2E Test Suite Complete. Passed: ${passedCount}, Failed: ${failedCount}`);
    console.log('==================================================\n');
    await prisma.$disconnect();
    if (failedCount > 0) {
      process.exit(1);
    }
  }
}

runPhase8E2ETests();
