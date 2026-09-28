import supertest from 'supertest';
import app from '../src/app.js';
import { prisma, ObligationsService } from '../src/services/obligations.service.js';
import { ReminderService } from '../src/services/reminder.service.js';
import { ObligationStatus, ReminderStatus, NotificationType, Recurrence, Priority } from '@prisma/client';

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

async function runPhase9ValidationTests() {
  console.log('\n==================================================');
  console.log('Running Obliqo Phase 9 Production Readiness & Final Validation Test Suite');
  console.log('==================================================\n');

  try {
    const demoUser = await ObligationsService.getOrCreateDemoUser();
    const userId = demoUser.id;

    // SCENARIO A: Gmail Actionable Message
    const scnA = await request.post('/api/ai/create-obligation').send({
      text: 'Your ICICI Lombard Health Insurance Policy #77483 expires on October 25, 2026. Premium: ₹9,800.',
      source: 'GMAIL',
    });
    if ((scnA.status === 201 || scnA.status === 200) && scnA.body.data?.id) {
      logPass('Scenario A: Gmail actionable message parsed & persisted successfully');
    } else {
      logFail('Scenario A: Failed to parse/persist Gmail message', scnA.body);
    }

    // SCENARIO B: Telegram Actionable Message
    const scnB = await request.post('/api/ai/create-obligation').send({
      text: 'Annual broadband internet subscription due on November 10, 2026. Amount: ₹4,999.',
      source: 'TELEGRAM',
    });
    if ((scnB.status === 201 || scnB.status === 200) && scnB.body.data?.id) {
      logPass('Scenario B: Telegram actionable message parsed & persisted successfully');
    } else {
      logFail('Scenario B: Failed to parse/persist Telegram message', scnB.body);
    }

    // SCENARIO C: Calendar Deadline Message
    const scnC = await request.post('/api/ai/create-obligation').send({
      text: 'Property Tax Payment deadline on December 15, 2026. Tax amount: ₹14,200.',
      source: 'CALENDAR',
    });
    if ((scnC.status === 201 || scnC.status === 200) && scnC.body.data?.id) {
      logPass('Scenario C: Calendar deadline parsed & persisted successfully');
    } else {
      logFail('Scenario C: Failed to parse/persist Calendar message', scnC.body);
    }

    // SCENARIO D: Non-Actionable Message
    const scnD = await request.post('/api/ai/create-obligation').send({
      text: 'Hey Aarav! Hope you are having a great weekend.',
      source: 'TELEGRAM',
    });
    if (scnD.status === 400 && scnD.body.success === false) {
      logPass('Scenario D: Non-actionable message correctly rejected');
    } else {
      logFail('Scenario D: Non-actionable message was improperly parsed as an obligation');
    }

    // SCENARIO E: Duplicate Message Detection
    const sourceMsg = await prisma.sourceMessage.create({
      data: {
        userId,
        source: 'GMAIL',
        externalId: 'msg-p9-dup-001',
        content: 'Your ICICI Lombard Health Insurance Policy #77483 expires on October 25, 2026. Premium: ₹9,800.',
      },
    });
    const dupCall = await ObligationsService.createObligation(
      {
        title: 'ICICI Lombard Health Insurance Policy',
        category: 'INSURANCE',
        amount: 9800,
        currency: 'INR',
        deadline: '2026-10-25T09:00:00.000Z',
        priority: 'HIGH',
        source: 'GMAIL',
        sourceMessageId: sourceMsg.id,
      },
      userId
    );
    const dupCall2 = await ObligationsService.createObligation(
      {
        title: 'ICICI Lombard Health Insurance Policy',
        category: 'INSURANCE',
        amount: 9800,
        currency: 'INR',
        deadline: '2026-10-25T09:00:00.000Z',
        priority: 'HIGH',
        source: 'GMAIL',
        sourceMessageId: sourceMsg.id,
      },
      userId
    );
    if (dupCall2.isDuplicate === true) {
      logPass('Scenario E: Duplicate message correctly detected idempotently');
    } else {
      logFail('Scenario E: Duplicate message was not detected');
    }

    // SCENARIO F: High-Priority Obligation Reminders
    const scnFObl = await prisma.obligation.create({
      data: {
        userId,
        title: 'High Priority Test Obligation P9',
        category: 'INSURANCE',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        priority: Priority.HIGH,
      },
    });
    await ReminderService.generateDefaultRemindersForObligation(scnFObl);
    const scnFReminders = await prisma.reminder.findMany({ where: { obligationId: scnFObl.id } });
    const scnFDays = scnFReminders.map((r) => r.daysBefore).sort((a, b) => (b ?? 0) - (a ?? 0));
    if (JSON.stringify(scnFDays) === JSON.stringify([7, 3, 1, 0])) {
      logPass('Scenario F: High-priority obligation generated [7, 3, 1, 0] daysBefore reminders');
    } else {
      logFail(`Scenario F: Expected [7, 3, 1, 0], got: ${JSON.stringify(scnFDays)}`);
    }

    // SCENARIO G: Medium-Priority Obligation Reminders
    const scnGObl = await prisma.obligation.create({
      data: {
        userId,
        title: 'Medium Priority Test Obligation P9',
        category: 'BILL',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        priority: Priority.MEDIUM,
      },
    });
    await ReminderService.generateDefaultRemindersForObligation(scnGObl);
    const scnGReminders = await prisma.reminder.findMany({ where: { obligationId: scnGObl.id } });
    const scnGDays = scnGReminders.map((r) => r.daysBefore).sort((a, b) => (b ?? 0) - (a ?? 0));
    if (JSON.stringify(scnGDays) === JSON.stringify([3, 1, 0])) {
      logPass('Scenario G: Medium-priority obligation generated [3, 1, 0] daysBefore reminders');
    } else {
      logFail(`Scenario G: Expected [3, 1, 0], got: ${JSON.stringify(scnGDays)}`);
    }

    // SCENARIO H: Low-Priority Obligation Reminders
    const scnHObl = await prisma.obligation.create({
      data: {
        userId,
        title: 'Low Priority Test Obligation P9',
        category: 'SUBSCRIPTION',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        priority: Priority.LOW,
      },
    });
    await ReminderService.generateDefaultRemindersForObligation(scnHObl);
    const scnHReminders = await prisma.reminder.findMany({ where: { obligationId: scnHObl.id } });
    const scnHDays = scnHReminders.map((r) => r.daysBefore).sort((a, b) => (b ?? 0) - (a ?? 0));
    if (JSON.stringify(scnHDays) === JSON.stringify([1, 0])) {
      logPass('Scenario H: Low-priority obligation generated [1, 0] daysBefore reminders');
    } else {
      logFail(`Scenario H: Expected [1, 0], got: ${JSON.stringify(scnHDays)}`);
    }

    // SCENARIO I: Upcoming Deadline Reminder
    const upcomingDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const scnIObl = await prisma.obligation.create({
      data: {
        userId,
        title: 'Upcoming Deadline Test Obligation P9',
        category: 'OTHER',
        deadline: upcomingDeadline,
        priority: Priority.MEDIUM,
      },
    });
    await ReminderService.generateDefaultRemindersForObligation(scnIObl);
    const scnIReminders = await prisma.reminder.findMany({ where: { obligationId: scnIObl.id } });
    if (scnIReminders.some((r) => r.daysBefore === 3)) {
      logPass('Scenario I: Upcoming 3-day deadline reminder correctly scheduled');
    } else {
      logFail('Scenario I: Upcoming deadline reminder missing');
    }

    // SCENARIO J: Due-Date Reminder Trigger
    const scnJObl = await prisma.obligation.create({
      data: {
        userId,
        title: 'Due Today Test Obligation P9',
        category: 'OTHER',
        deadline: new Date(),
        priority: Priority.MEDIUM,
      },
    });
    await prisma.reminder.create({
      data: {
        userId,
        obligationId: scnJObl.id,
        remindAt: new Date(Date.now() - 5000),
        daysBefore: 0,
        status: ReminderStatus.PENDING,
      },
    });
    await ReminderService.processDueReminders();
    const dueNotif = await prisma.notification.findFirst({
      where: { obligationId: scnJObl.id, type: NotificationType.REMINDER },
    });
    if (dueNotif && dueNotif.message.includes('due today')) {
      logPass('Scenario J: Due-date reminder triggered REMINDER type notification ("due today")');
    } else {
      logFail('Scenario J: Due-date reminder notification missing or incorrect');
    }

    // SCENARIO K: Overdue Obligation Handling
    const scnKObl = await prisma.obligation.create({
      data: {
        userId,
        title: 'Overdue Test Obligation P9',
        category: 'OTHER',
        deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        priority: Priority.HIGH,
      },
    });
    await ReminderService.processOverdueObligations();
    await ReminderService.processOverdueObligations();
    const overdueNotifs = await prisma.notification.findMany({
      where: { obligationId: scnKObl.id, message: { contains: 'overdue' } },
    });
    if (overdueNotifs.length === 1) {
      logPass('Scenario K: Overdue obligation created single overdue notification idempotently');
    } else {
      logFail(`Scenario K: Expected 1 overdue notification, got ${overdueNotifs.length}`);
    }

    // SCENARIO L: Completed Obligation Handling
    const scnLObl = await prisma.obligation.create({
      data: {
        userId,
        title: 'Completed Test Obligation P9',
        category: 'BILL',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        priority: Priority.MEDIUM,
      },
    });
    await ReminderService.generateDefaultRemindersForObligation(scnLObl);
    const compRes = await request.post(`/api/obligations/${scnLObl.id}/complete`);
    const scnLReminders = await prisma.reminder.findMany({ where: { obligationId: scnLObl.id } });
    const allCancelledL = scnLReminders.every((r) => r.status === ReminderStatus.CANCELLED);
    if (compRes.status === 200 && allCancelledL) {
      logPass('Scenario L: Completed obligation cancelled all future pending reminders');
    } else {
      logFail('Scenario L: Pending reminders were not cancelled upon completion');
    }

    // SCENARIO M: Archived Obligation Handling
    const scnMObl = await prisma.obligation.create({
      data: {
        userId,
        title: 'Archived Test Obligation P9',
        category: 'OTHER',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        priority: Priority.HIGH,
      },
    });
    await ReminderService.generateDefaultRemindersForObligation(scnMObl);
    const archRes = await request.post(`/api/obligations/${scnMObl.id}/archive`);
    const scnMReminders = await prisma.reminder.findMany({ where: { obligationId: scnMObl.id } });
    const allCancelledM = scnMReminders.every((r) => r.status === ReminderStatus.CANCELLED);
    if (archRes.status === 200 && allCancelledM) {
      logPass('Scenario M: Archived obligation cancelled all future pending reminders');
    } else {
      logFail('Scenario M: Pending reminders were not cancelled upon archive');
    }

    // SCENARIO N: Recurring Obligation Generation
    const scnNObl = await prisma.obligation.create({
      data: {
        userId,
        title: 'Spotify Premium Subscription Recurring P9',
        category: 'SUBSCRIPTION',
        amount: 119,
        deadline: new Date('2026-10-01T10:00:00.000Z'),
        priority: Priority.LOW,
        recurrence: Recurrence.MONTHLY,
      },
    });
    await ObligationsService.completeObligation(scnNObl.id, userId);
    const nextOcc = await prisma.obligation.findFirst({
      where: {
        userId,
        title: 'Spotify Premium Subscription Recurring P9',
        deadline: new Date('2026-11-01T10:00:00.000Z'),
        status: ObligationStatus.PENDING,
      },
    });
    if (nextOcc) {
      logPass('Scenario N: Recurring monthly obligation generated next occurrence on completion');
    } else {
      logFail('Scenario N: Next occurrence for recurring obligation was not created');
    }

    // SCENARIO O: Notification Marked as Read
    const targetNotif = await prisma.notification.findFirst({
      where: { userId, isRead: false },
    });
    if (targetNotif) {
      const markRes = await request.patch(`/api/notifications/${targetNotif.id}/read`);
      if (markRes.status === 200 && markRes.body.data.isRead === true) {
        logPass('Scenario O: Notification correctly marked as read (isRead = true)');
      } else {
        logFail('Scenario O: Failed to mark notification as read');
      }
    } else {
      logFail('Scenario O: No unread notification found to test');
    }

    // SCENARIO P: Multiple Notifications List
    const listRes = await request.get('/api/notifications');
    if (listRes.status === 200 && Array.isArray(listRes.body.data) && listRes.body.data.length > 0) {
      logPass('Scenario P: GET /api/notifications returned list of user notifications');
    } else {
      logFail('Scenario P: Failed to fetch notifications list');
    }

    // SCENARIO Q: Backend / DB Graceful Error Handling
    const errRes = await request.get('/api/obligations/nonexistent-uuid-9999');
    if (errRes.status === 404 && errRes.body.success === false) {
      logPass('Scenario Q: Non-existent obligation ID handled gracefully with HTTP 404');
    } else {
      logFail('Scenario Q: Expected HTTP 404 for nonexistent obligation');
    }

    // SCENARIO R: Invalid Source Payload Rejection
    const invSrcRes = await request.post('/api/obligations').send({
      title: 'Invalid Source Test',
      source: 'INVALID_SOURCE_ENUM',
    });
    if (invSrcRes.status === 400 && invSrcRes.body.success === false) {
      logPass('Scenario R: Invalid source payload rejected with HTTP 400');
    } else {
      logFail('Scenario R: Invalid source payload was not rejected');
    }

    // SCENARIO S: Invalid / Empty Message Content
    const emptyMsgRes = await request.post('/api/ai/extract-obligation').send({
      text: '  ',
    });
    if (emptyMsgRes.status === 400 && emptyMsgRes.body.success === false) {
      logPass('Scenario S: Empty message text rejected with HTTP 400');
    } else {
      logFail('Scenario S: Empty text was not rejected');
    }
  } catch (err) {
    console.error('Phase 9 Test Execution Error:', err);
  } finally {
    console.log('\n==================================================');
    console.log(`Phase 9 Test Suite Complete. Passed: ${passedCount}, Failed: ${failedCount}`);
    console.log('==================================================\n');
    await prisma.$disconnect();
    if (failedCount > 0) {
      process.exit(1);
    }
  }
}

runPhase9ValidationTests();
