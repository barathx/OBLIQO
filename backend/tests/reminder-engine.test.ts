import supertest from 'supertest';
import app from '../src/app.js';
import { prisma, ObligationsService } from '../src/services/obligations.service.js';
import { ReminderService } from '../src/services/reminder.service.js';
import { Priority, Recurrence, ReminderStatus, NotificationType } from '@prisma/client';

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

async function runReminderEngineTests() {
  console.log('\n==================================================');
  console.log('Running Obliqo Phase 7 Reminder & Notification Engine Tests');
  console.log('==================================================\n');

  try {
    const demoUser = await ObligationsService.getOrCreateDemoUser();
    const userId = demoUser.id;

    // --------------------------------------------------
    // TEST 1: Create an obligation with deadline 7 days from now -> Reminder created
    // --------------------------------------------------
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const test1Res = await request.post('/api/obligations').send({
      title: 'Health Insurance Renewal Test1',
      category: 'INSURANCE',
      amount: 5000,
      deadline: in7Days.toISOString(),
      priority: 'MEDIUM',
      recurrence: 'NONE',
    });

    if (test1Res.status === 201 || test1Res.status === 200) {
      const oblId = test1Res.body.data.id;
      const reminders = await prisma.reminder.findMany({ where: { obligationId: oblId } });
      if (reminders.length > 0) {
        logPass('TEST 1: Create obligation with 7-day deadline -> Reminders created in DB');
      } else {
        logFail('TEST 1: No reminders found for created obligation');
      }
    } else {
      logFail('TEST 1: Failed to create obligation', test1Res.body);
    }

    // --------------------------------------------------
    // TEST 2: Create HIGH priority obligation -> 7-day, 3-day, 1-day, 0-day reminders
    // --------------------------------------------------
    const test2Res = await request.post('/api/obligations').send({
      title: 'Car Insurance Renewal High Priority',
      category: 'INSURANCE',
      amount: 8500,
      deadline: in7Days.toISOString(),
      priority: 'HIGH',
      recurrence: 'NONE',
    });

    if (test2Res.status === 201 || test2Res.status === 200) {
      const oblId = test2Res.body.data.id;
      const reminders = await prisma.reminder.findMany({ where: { obligationId: oblId } });
      const daysBeforeList = reminders.map((r) => r.daysBefore).sort((a, b) => (b ?? 0) - (a ?? 0));
      if (JSON.stringify(daysBeforeList) === JSON.stringify([7, 3, 1, 0])) {
        logPass('TEST 2: HIGH priority obligation creates 7, 3, 1, 0 daysBefore reminders');
      } else {
        logFail(`TEST 2: Expected [7, 3, 1, 0] daysBefore reminders, got: ${JSON.stringify(daysBeforeList)}`);
      }
    } else {
      logFail('TEST 2: Failed to create HIGH priority obligation');
    }

    // --------------------------------------------------
    // TEST 3: Create MEDIUM priority obligation -> 3-day, 1-day, 0-day reminders
    // --------------------------------------------------
    const test3Res = await request.post('/api/obligations').send({
      title: 'Electricity Bill Medium Priority',
      category: 'BILL',
      amount: 1200,
      deadline: in7Days.toISOString(),
      priority: 'MEDIUM',
      recurrence: 'NONE',
    });

    if (test3Res.status === 201 || test3Res.status === 200) {
      const oblId = test3Res.body.data.id;
      const reminders = await prisma.reminder.findMany({ where: { obligationId: oblId } });
      const daysBeforeList = reminders.map((r) => r.daysBefore).sort((a, b) => (b ?? 0) - (a ?? 0));
      if (JSON.stringify(daysBeforeList) === JSON.stringify([3, 1, 0])) {
        logPass('TEST 3: MEDIUM priority obligation creates 3, 1, 0 daysBefore reminders');
      } else {
        logFail(`TEST 3: Expected [3, 1, 0] daysBefore reminders, got: ${JSON.stringify(daysBeforeList)}`);
      }
    } else {
      logFail('TEST 3: Failed to create MEDIUM priority obligation');
    }

    // --------------------------------------------------
    // TEST 4: Create LOW priority obligation -> 1-day, 0-day reminders
    // --------------------------------------------------
    const test4Res = await request.post('/api/obligations').send({
      title: 'Gym Membership Low Priority',
      category: 'SUBSCRIPTION',
      amount: 500,
      deadline: in7Days.toISOString(),
      priority: 'LOW',
      recurrence: 'NONE',
    });

    if (test4Res.status === 201 || test4Res.status === 200) {
      const oblId = test4Res.body.data.id;
      const reminders = await prisma.reminder.findMany({ where: { obligationId: oblId } });
      const daysBeforeList = reminders.map((r) => r.daysBefore).sort((a, b) => (b ?? 0) - (a ?? 0));
      if (JSON.stringify(daysBeforeList) === JSON.stringify([1, 0])) {
        logPass('TEST 4: LOW priority obligation creates 1, 0 daysBefore reminders');
      } else {
        logFail(`TEST 4: Expected [1, 0] daysBefore reminders, got: ${JSON.stringify(daysBeforeList)}`);
      }
    } else {
      logFail('TEST 4: Failed to create LOW priority obligation');
    }

    // --------------------------------------------------
    // TEST 5: Mark obligation COMPLETED -> Future reminders do not trigger (status CANCELLED)
    // --------------------------------------------------
    const test5Obl = await prisma.obligation.create({
      data: {
        userId,
        title: 'Completed Test Obligation',
        category: 'OTHER',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        priority: 'MEDIUM',
      },
    });
    await ReminderService.generateDefaultRemindersForObligation(test5Obl);

    const completeRes = await request.post(`/api/obligations/${test5Obl.id}/complete`);
    if (completeRes.status === 200) {
      const reminders = await prisma.reminder.findMany({ where: { obligationId: test5Obl.id } });
      const allCancelledOrSent = reminders.every((r) => r.status === ReminderStatus.CANCELLED || r.status === ReminderStatus.SENT);
      if (allCancelledOrSent && reminders.length > 0) {
        logPass('TEST 5: Completing obligation cancels future pending reminders');
      } else {
        logFail('TEST 5: Pending reminders were not cancelled upon completion');
      }
    } else {
      logFail('TEST 5: Failed to complete obligation');
    }

    // --------------------------------------------------
    // TEST 6: Mark obligation ARCHIVED/CANCELLED -> Future reminders do not trigger
    // --------------------------------------------------
    const test6Obl = await prisma.obligation.create({
      data: {
        userId,
        title: 'Archived Test Obligation',
        category: 'OTHER',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        priority: 'HIGH',
      },
    });
    await ReminderService.generateDefaultRemindersForObligation(test6Obl);

    const archiveRes = await request.post(`/api/obligations/${test6Obl.id}/archive`);
    if (archiveRes.status === 200) {
      const reminders = await prisma.reminder.findMany({ where: { obligationId: test6Obl.id } });
      const allCancelled = reminders.every((r) => r.status === ReminderStatus.CANCELLED);
      if (allCancelled && reminders.length > 0) {
        logPass('TEST 6: Archiving obligation cancels future pending reminders');
      } else {
        logFail('TEST 6: Pending reminders were not cancelled upon archive');
      }
    } else {
      logFail('TEST 6: Failed to archive obligation');
    }

    // --------------------------------------------------
    // TEST 7: Run scheduler twice -> No duplicate notification
    // --------------------------------------------------
    const duePast = new Date(Date.now() - 10000); // 10 seconds ago
    const test7Obl = await prisma.obligation.create({
      data: {
        userId,
        title: 'Scheduler Idempotency Test Obligation',
        category: 'OTHER',
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        priority: 'MEDIUM',
      },
    });
    const dueReminder = await prisma.reminder.create({
      data: {
        userId,
        obligationId: test7Obl.id,
        remindAt: duePast,
        daysBefore: 1,
        status: ReminderStatus.PENDING,
      },
    });

    // Run due reminders processing twice
    await ReminderService.processDueReminders();
    await ReminderService.processDueReminders();

    const notifs = await prisma.notification.findMany({
      where: { obligationId: test7Obl.id, type: NotificationType.DEADLINE_APPROACHING },
    });
    if (notifs.length === 1) {
      logPass('TEST 7: Running scheduler twice prevented duplicate notifications');
    } else {
      logFail(`TEST 7: Expected 1 notification, got ${notifs.length}`);
    }

    // --------------------------------------------------
    // TEST 8: Create overdue obligation -> Overdue status/notification handled correctly
    // --------------------------------------------------
    const overdueDeadline = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    const test8Obl = await prisma.obligation.create({
      data: {
        userId,
        title: 'Overdue Test Insurance Policy',
        category: 'INSURANCE',
        amount: 3000,
        deadline: overdueDeadline,
        priority: 'HIGH',
      },
    });

    await ReminderService.processOverdueObligations();
    const overdueNotifs = await prisma.notification.findMany({
      where: { obligationId: test8Obl.id, message: { contains: 'overdue' } },
    });
    if (overdueNotifs.length >= 1) {
      logPass('TEST 8: Overdue obligation correctly generated overdue notification');
    } else {
      logFail('TEST 8: Failed to generate overdue notification for overdue obligation');
    }

    // --------------------------------------------------
    // TEST 9: Recurring monthly obligation -> Next occurrence generated on completion
    // --------------------------------------------------
    const septDeadline = new Date('2026-09-29T10:00:00.000Z');
    const test9Obl = await prisma.obligation.create({
      data: {
        userId,
        title: 'Netflix Subscription Recurring Test',
        category: 'SUBSCRIPTION',
        amount: 649,
        deadline: septDeadline,
        priority: 'LOW',
        recurrence: Recurrence.MONTHLY,
      },
    });

    await ObligationsService.completeObligation(test9Obl.id, userId);

    const octDeadline = new Date(septDeadline);
    octDeadline.setMonth(octDeadline.getMonth() + 1);

    const nextRecurring = await prisma.obligation.findFirst({
      where: {
        userId,
        title: 'Netflix Subscription Recurring Test',
        deadline: octDeadline,
        status: 'PENDING',
      },
    });

    if (nextRecurring) {
      logPass('TEST 9: Recurring monthly obligation created next occurrence (Oct 29)');
    } else {
      logFail('TEST 9: Next recurring obligation was not created');
    }

    // --------------------------------------------------
    // TEST 10: Notification API -> Unread notifications are returned
    // --------------------------------------------------
    const unreadRes = await request.get('/api/notifications/unread');
    if (unreadRes.status === 200 && Array.isArray(unreadRes.body.data)) {
      logPass('TEST 10: GET /api/notifications/unread returned list of unread notifications');
    } else {
      logFail('TEST 10: Failed to fetch unread notifications via API');
    }

    // --------------------------------------------------
    // TEST 11: Mark notification as read -> isRead changes correctly
    // --------------------------------------------------
    const notifToMark = await prisma.notification.findFirst({
      where: { userId, isRead: false },
    });

    if (notifToMark) {
      const readRes = await request.patch(`/api/notifications/${notifToMark.id}/read`);
      if (readRes.status === 200 && readRes.body.data.isRead === true) {
        logPass('TEST 11: PATCH /api/notifications/:id/read correctly set isRead = true');
      } else {
        logFail('TEST 11: Failed to mark single notification as read');
      }
    } else {
      logFail('TEST 11: No unread notification available to test markRead');
    }

    // --------------------------------------------------
    // TEST 12: Mark all notifications as read -> All unread notifications become read
    // --------------------------------------------------
    const markAllRes = await request.patch('/api/notifications/read-all');
    if (markAllRes.status === 200) {
      const remainingUnread = await prisma.notification.count({
        where: { userId, isRead: false },
      });
      if (remainingUnread === 0) {
        logPass('TEST 12: PATCH /api/notifications/read-all marked all notifications as read');
      } else {
        logFail(`TEST 12: Expected 0 unread notifications after read-all, found ${remainingUnread}`);
      }
    } else {
      logFail('TEST 12: Failed to call read-all notifications endpoint');
    }
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    console.log('\n==================================================');
    console.log(`Phase 7 Test Suite Complete. Passed: ${passedCount}, Failed: ${failedCount}`);
    console.log('==================================================\n');
    await prisma.$disconnect();
    if (failedCount > 0) {
      process.exit(1);
    }
  }
}

runReminderEngineTests();
