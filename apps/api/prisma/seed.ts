import { PrismaClient, BillingInterval, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding reference data...');

  // ---------- SUBSCRIPTION PLANS ----------
  const plans = [
    {
      code: 'STARTER',
      name: 'Starter',
      priceKes: 0,
      billingInterval: BillingInterval.MONTHLY,
      maxEventsPerMonth: 2,
      maxAttendeesEvent: 50,
      features: { analytics: false, prioritySupport: false, customBranding: false },
    },
    {
      code: 'PRO',
      name: 'Pro',
      priceKes: 2500,
      billingInterval: BillingInterval.MONTHLY,
      maxEventsPerMonth: null,
      maxAttendeesEvent: 500,
      features: { analytics: true, prioritySupport: false, customBranding: false },
    },
    {
      code: 'BUSINESS',
      name: 'Business',
      priceKes: 7500,
      billingInterval: BillingInterval.MONTHLY,
      maxEventsPerMonth: null,
      maxAttendeesEvent: null,
      features: { analytics: true, prioritySupport: true, customBranding: true },
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    });
    console.log(`  ✓ Plan: ${plan.name}`);
  }

  // ---------- EVENT CATEGORIES ----------
  const categories = [
    { code: 'FESTIVAL', name: 'Festivals' },
    { code: 'CONFERENCE', name: 'Conferences' },
    { code: 'ENTERTAINMENT', name: 'Entertainment' },
    { code: 'SPORTS', name: 'Sports' },
    { code: 'ARTS', name: 'Arts & Culture' },
    { code: 'COMMUNITY', name: 'Community' },
    { code: 'EDUCATION', name: 'Workshops & Education' },
    { code: 'BUSINESS', name: 'Business & Networking' },
  ];

  for (const category of categories) {
    await prisma.eventCategory.upsert({
      where: { code: category.code },
      update: category,
      create: category,
    });
    console.log(`  ✓ Category: ${category.name}`);
  }

  // ---------- SUPER ADMIN USER ----------
  console.log('Creating Super Admin...');
  
  const adminEmail = 'thomasotieno918@gmail.com';
  const adminPassword = 'Thoma100#';
  
  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    // Hash the password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    await prisma.user.create({
      data: {
        email: adminEmail,
        phone: '0700000000', // Required unique field for the database
        passwordHash: passwordHash,
        fullName: 'Admin', // As requested
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });
    console.log('  ✓ Super Admin created successfully.');
    console.log(`  ➜ Email: ${adminEmail}`);
    console.log(`  ➜ Password: ${adminPassword}`);
  } else {
    console.log('  - Super Admin already exists. Skipping creation.');
  }

  console.log('✅ Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });