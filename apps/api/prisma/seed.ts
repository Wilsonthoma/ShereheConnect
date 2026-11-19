import { PrismaClient, BillingInterval, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // ---------- SUPER ADMIN USER ----------
  const adminEmail = 'thomasotieno918@gmail.com';
  const adminPassword = 'Thoma100#';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    await prisma.user.create({
      data: {
        email: adminEmail,
        phone: '+254711000001',
        passwordHash,
        fullName: 'Thomas Otieno',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        phoneVerified: true,
      },
    });
    console.log(`Seeded admin user: ${adminEmail}`);
  }

  // ---------- SUBSCRIPTION PLANS (INCLUDES 50 KES STARTER PLAN) ----------
  await prisma.subscriptionPlan.upsert({
    where: { code: 'STARTER' },
    update: {
      name: 'Starter',
      priceKes: 50,
      billingInterval: BillingInterval.MONTHLY,
      maxEventsPerMonth: 2,
      maxAttendeesEvent: 100,
      features: {
        stkPush: true,
        prioritySupport: false,
        analytics: 'basic',
      },
      isActive: true,
    },
    create: {
      code: 'STARTER',
      name: 'Starter',
      priceKes: 50,
      billingInterval: BillingInterval.MONTHLY,
      maxEventsPerMonth: 2,
      maxAttendeesEvent: 100,
      features: {
        stkPush: true,
        prioritySupport: false,
        analytics: 'basic',
      },
      isActive: true,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { code: 'PRO' },
    update: {
      name: 'Pro',
      priceKes: 1500,
      billingInterval: BillingInterval.MONTHLY,
      maxEventsPerMonth: 15,
      maxAttendeesEvent: 1000,
      features: {
        stkPush: true,
        prioritySupport: true,
        analytics: 'advanced',
      },
      isActive: true,
    },
    create: {
      code: 'PRO',
      name: 'Pro',
      priceKes: 1500,
      billingInterval: BillingInterval.MONTHLY,
      maxEventsPerMonth: 15,
      maxAttendeesEvent: 1000,
      features: {
        stkPush: true,
        prioritySupport: true,
        analytics: 'advanced',
      },
      isActive: true,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { code: 'BUSINESS' },
    update: {
      name: 'Business',
      priceKes: 4500,
      billingInterval: BillingInterval.MONTHLY,
      maxEventsPerMonth: null,
      maxAttendeesEvent: null,
      features: {
        stkPush: true,
        prioritySupport: true,
        analytics: 'full',
      },
      isActive: true,
    },
    create: {
      code: 'BUSINESS',
      name: 'Business',
      priceKes: 4500,
      billingInterval: BillingInterval.MONTHLY,
      maxEventsPerMonth: null,
      maxAttendeesEvent: null,
      features: {
        stkPush: true,
        prioritySupport: true,
        analytics: 'full',
      },
      isActive: true,
    },
  });
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });