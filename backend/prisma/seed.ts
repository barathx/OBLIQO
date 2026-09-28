import { PrismaClient, ObligationCategory, Priority, Recurrence, ObligationSource, ObligationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[Obliqo Seed] Starting database seed...');

  // Create or retrieve demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@obliqo.ai' },
    update: {},
    create: {
      email: 'demo@obliqo.ai',
      name: 'Alex Morgan',
    },
  });

  console.log(`[Obliqo Seed] Created demo user: ${demoUser.name} (${demoUser.email})`);

  // Define realistic demo obligations requested in Section 17
  const sampleObligations = [
    {
      title: 'Car Insurance Renewal',
      description: 'Annual comprehensive auto insurance policy renewal with Progressive.',
      category: ObligationCategory.INSURANCE,
      amount: 850.00,
      currency: 'USD',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      priority: Priority.HIGH,
      recurrence: Recurrence.YEARLY,
      source: ObligationSource.GMAIL,
      status: ObligationStatus.PENDING,
      sourceMessage: {
        source: ObligationSource.GMAIL,
        externalId: 'msg_gmail_car_ins_981',
        sender: 'renewals@progressive.com',
        subject: 'Notice: Your Auto Policy #98213 is expiring soon',
        content: 'Your auto insurance policy is set to expire in 14 days. Please review and process payment to maintain continuous coverage.',
        receivedAt: new Date(),
        metadata: { policyId: '98213', carrier: 'Progressive' },
      },
    },
    {
      title: 'Electricity Bill',
      description: 'Monthly residential power utility bill payment.',
      category: ObligationCategory.BILL,
      amount: 142.50,
      currency: 'USD',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      priority: Priority.HIGH,
      recurrence: Recurrence.MONTHLY,
      source: ObligationSource.GMAIL,
      status: ObligationStatus.PENDING,
      sourceMessage: {
        source: ObligationSource.GMAIL,
        externalId: 'msg_gmail_utility_304',
        sender: 'billing@citypower.gov',
        subject: 'Your Monthly Power Bill Statement',
        content: 'Your electricity usage for the past cycle is $142.50. Due date is approaching.',
        receivedAt: new Date(),
        metadata: { meterNumber: 'MTR-88231' },
      },
    },
    {
      title: 'Vehicle Service',
      description: 'Scheduled 15,000-mile periodic maintenance checkup at service center.',
      category: ObligationCategory.SERVICE,
      amount: 220.00,
      currency: 'USD',
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      priority: Priority.MEDIUM,
      recurrence: Recurrence.CUSTOM,
      source: ObligationSource.CALENDAR,
      status: ObligationStatus.PENDING,
    },
    {
      title: 'Netflix Subscription',
      description: 'Monthly streaming subscription auto-renewal.',
      category: ObligationCategory.SUBSCRIPTION,
      amount: 19.99,
      currency: 'USD',
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      priority: Priority.LOW,
      recurrence: Recurrence.MONTHLY,
      source: ObligationSource.MANUAL,
      status: ObligationStatus.PENDING,
    },
    {
      title: 'Driving License Renewal',
      description: 'State DMV driver license renewal requirement.',
      category: ObligationCategory.DOCUMENT,
      amount: 45.00,
      currency: 'USD',
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      priority: Priority.CRITICAL,
      recurrence: Recurrence.CUSTOM,
      source: ObligationSource.DOCUMENT,
      status: ObligationStatus.PENDING,
    },
  ];

  for (const item of sampleObligations) {
    let sourceMsgId: string | undefined = undefined;

    if (item.sourceMessage) {
      const createdSourceMsg = await prisma.sourceMessage.create({
        data: {
          userId: demoUser.id,
          source: item.sourceMessage.source,
          externalId: item.sourceMessage.externalId,
          sender: item.sourceMessage.sender,
          subject: item.sourceMessage.subject,
          content: item.sourceMessage.content,
          receivedAt: item.sourceMessage.receivedAt,
          metadata: item.sourceMessage.metadata,
        },
      });
      sourceMsgId = createdSourceMsg.id;
    }

    const createdObligation = await prisma.obligation.create({
      data: {
        userId: demoUser.id,
        title: item.title,
        description: item.description,
        category: item.category,
        amount: item.amount,
        currency: item.currency,
        deadline: item.deadline,
        priority: item.priority,
        recurrence: item.recurrence,
        source: item.source,
        status: item.status,
        sourceMessageId: sourceMsgId,
      },
    });

    // Create initial ActivityEvent for seed testing
    await prisma.activityEvent.create({
      data: {
        userId: demoUser.id,
        obligationId: createdObligation.id,
        type: 'OBLIGATION_DETECTED',
        title: 'Obligation Detected',
        description: `Obligation "${createdObligation.title}" was registered into Obliqo intelligence pool.`,
      },
    });

    console.log(`[Obliqo Seed] Created obligation: ${createdObligation.title}`);
  }

  console.log('[Obliqo Seed] Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('[Obliqo Seed] Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
