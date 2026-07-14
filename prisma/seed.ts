/**
 * FreshLink – Seed Script
 *
 * Creates a handful of buyers and providers across all categories
 * so search/booking can be tested end to end.
 *
 * Run: npx ts-node -r tsconfig-paths/register prisma/seed.ts
 * Or:  npm run seed   (once script is wired in package.json)
 */

import 'dotenv/config';
import { PrismaClient, ProviderCategory, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter } as any);

const PASS = 'Password1!'; // shared password for all seed users

async function hash(pw: string) {
  return bcrypt.hash(pw, 12);
}

async function main() {
  console.log('🌱 Seeding FreshLink database...');

  // ── Tags ────────────────────────────────────────────────────────────────
  const tagNames = ['vegan', 'halal', 'gluten-free', 'kosher', 'nut-free', 'cocktails', 'wine-pairing', 'organic'];
  const tags = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({ where: { name }, create: { name }, update: {} }),
    ),
  );
  const tagMap = Object.fromEntries(tags.map((t) => [t.name, t.id]));
  console.log('  ✔ Tags created');

  // ── Buyers ───────────────────────────────────────────────────────────────
  const buyerData = [
    { email: 'amaka.okafor@example.com', firstName: 'Amaka', lastName: 'Okafor', buyerType: 'individual', dietaryPreferences: ['vegan'] },
    { email: 'heritage.hotel@example.com', firstName: 'Heritage', lastName: 'Hotel', buyerType: 'hotel', companyName: 'Heritage Boutique Hotel', dietaryPreferences: ['halal'] },
    { email: 'techcorp.events@example.com', firstName: 'TechCorp', lastName: 'Events', buyerType: 'corporate', companyName: 'TechCorp Nigeria Ltd', dietaryPreferences: [] },
  ];

  for (const b of buyerData) {
    await prisma.user.upsert({
      where: { email: b.email },
      create: {
        email: b.email,
        passwordHash: await hash(PASS),
        firstName: b.firstName,
        lastName: b.lastName,
        role: Role.BUYER,
        isEmailVerified: true,
        buyerProfile: {
            create: {
              buyerType: b.buyerType,
              companyName: (b as any).companyName,
              city: 'Lagos',
              country: 'NG',
              dietaryPreferences: (b as any).dietaryPreferences || [],
            },
        },
      },
      update: {},
    });
  }
  console.log('  ✔ Buyers created');

  // ── Providers ────────────────────────────────────────────────────────────
  interface ProviderSeed {
    email: string;
    firstName: string;
    lastName: string;
    category: ProviderCategory;
    businessName: string;
    bio: string;
    city: string;
    serviceRadiusKm: number;
    allowsInstantBook: boolean;
    tags: string[];
    basePrice: number;
    serviceName: string;
  }

  const providerData: ProviderSeed[] = [
    {
      email: 'chidi.farm@example.com',
      firstName: 'Chidi',
      lastName: 'Eze',
      category: ProviderCategory.FARMER,
      businessName: "Chidi's Organic Farm",
      bio: 'Family-run organic farm in Ogun State supplying Lagos restaurants with fresh produce since 2015. Certified organic by NAFDAC.',
      city: 'Abeokuta',
      serviceRadiusKm: 120,
      allowsInstantBook: true,
      tags: ['organic', 'vegan'],
      basePrice: 25000,
      serviceName: 'Weekly Produce Box (20kg)',
    },
    {
      email: 'fatima.chef@example.com',
      firstName: 'Fatima',
      lastName: 'Aliyu',
      category: ProviderCategory.CHEF,
      businessName: 'Chef Fatima Private Dining',
      bio: 'Award-winning private chef specialising in contemporary Nigerian and continental cuisine. 10 years fine-dining experience. Available for dinner parties and corporate events.',
      city: 'Lagos',
      serviceRadiusKm: 40,
      allowsInstantBook: false,
      tags: ['halal', 'gluten-free'],
      basePrice: 150000,
      serviceName: 'Private Dinner (up to 12 guests)',
    },
    {
      email: 'ngozi.baker@example.com',
      firstName: 'Ngozi',
      lastName: 'Adeyemi',
      category: ProviderCategory.BAKER,
      businessName: "Ngozi's Artisan Bakery",
      bio: 'Artisan baker creating custom celebration cakes, pastries, and bread. Gluten-free and vegan options available. Minimum 5-day notice.',
      city: 'Abuja',
      serviceRadiusKm: 30,
      allowsInstantBook: false,
      tags: ['vegan', 'gluten-free', 'nut-free'],
      basePrice: 45000,
      serviceName: 'Custom 3-tier Celebration Cake',
    },
    {
      email: 'tunde.caterer@example.com',
      firstName: 'Tunde',
      lastName: 'Balogun',
      category: ProviderCategory.CATERER,
      businessName: 'Tunde Premium Catering',
      bio: 'Full-service catering company for weddings, corporate events, and parties. Serving 50–2000 guests. HACCP certified kitchen.',
      city: 'Lagos',
      serviceRadiusKm: 60,
      allowsInstantBook: false,
      tags: ['halal', 'kosher'],
      basePrice: 3500,
      serviceName: 'Event Catering (per head)',
    },
    {
      email: 'blessing.mealprep@example.com',
      firstName: 'Blessing',
      lastName: 'Okonkwo',
      category: ProviderCategory.MEAL_PREP,
      businessName: 'Blessings Healthy Meal Prep',
      bio: 'Weekly macro-balanced meal prep for busy professionals and fitness enthusiasts. Keto, vegan, and standard plans available. Free delivery within Lekki.',
      city: 'Lagos',
      serviceRadiusKm: 20,
      allowsInstantBook: true,
      tags: ['vegan', 'organic', 'gluten-free'],
      basePrice: 35000,
      serviceName: 'Weekly Meal Plan (5 days × 3 meals)',
    },
    {
      email: 'emeka.bartender@example.com',
      firstName: 'Emeka',
      lastName: 'Nwosu',
      category: ProviderCategory.BARTENDER,
      businessName: 'Emeka Mixology',
      bio: 'Certified mixologist with 8 years of event experience. Specialises in craft cocktails, mocktails, and wine service. Own mobile bar setup available.',
      city: 'Lagos',
      serviceRadiusKm: 50,
      allowsInstantBook: true,
      tags: ['cocktails', 'wine-pairing'],
      basePrice: 80000,
      serviceName: 'Mobile Bar Service (4 hours)',
    },
  ];

  for (const p of providerData) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      create: {
        email: p.email,
        passwordHash: await hash(PASS),
        firstName: p.firstName,
        lastName: p.lastName,
        role: Role.PROVIDER,
        isEmailVerified: true,
        providerProfile: {
          create: {
            category: p.category,
            bio: p.bio,
            businessName: p.businessName,
            city: p.city,
            country: 'NG',
            serviceRadiusKm: p.serviceRadiusKm,
            allowsInstantBook: p.allowsInstantBook,
            isAvailable: true,
            completenessScore: 75,
          },
        },
      },
      update: {},
      include: { providerProfile: true },
    });

    const profile = user.providerProfile;
    if (!profile) continue;

    // Pricing
    await prisma.pricingItem.upsert({
      where: { id: `seed-pricing-${profile.id}` },
      create: {
        id: `seed-pricing-${profile.id}`,
        providerProfileId: profile.id,
        serviceName: p.serviceName,
        basePrice: p.basePrice,
        currency: 'NGN',
        unit: 'per event',
      },
      update: {},
    });

    // Tags
    for (const tagName of p.tags) {
      const tagId = tagMap[tagName];
      if (!tagId) continue;
      await prisma.providerTag.upsert({
        where: { providerProfileId_tagId: { providerProfileId: profile.id, tagId } },
        create: { providerProfileId: profile.id, tagId },
        update: {},
      });
    }

    // Availability slots (next 4 Saturdays)
    for (let w = 1; w <= 4; w++) {
      const start = new Date();
      start.setDate(start.getDate() + w * 7);
      start.setHours(9, 0, 0, 0);
      const end = new Date(start);
      end.setHours(17, 0, 0, 0);

      await prisma.availabilitySlot.create({
        data: { providerProfileId: profile.id, startTime: start, endTime: end },
      }).catch(() => {}); // ignore duplicates on re-seed
    }

    // Portfolio stub
    await prisma.portfolioItem.upsert({
      where: { id: `seed-portfolio-${profile.id}` },
      create: {
        id: `seed-portfolio-${profile.id}`,
        providerProfileId: profile.id,
        title: 'Featured Work',
        description: 'Sample portfolio image',
        mediaUrl: `https://picsum.photos/seed/${profile.id}/800/600`,
        mediaType: 'image',
      },
      update: {},
    });
  }

  console.log('  ✔ Providers created');
  console.log(`\n✅ Seed complete! Login with any seed email and password: ${PASS}`);
  console.log('\nSeed accounts:');
  const allUsers = [
    ...buyerData.map(u => ({ ...u, resolvedRole: 'BUYER' })),
    ...providerData.map(u => ({ ...u, resolvedRole: 'PROVIDER' })),
  ];
  allUsers.forEach((u) =>
    console.log(`  ${u.resolvedRole} | ${u.email} | ${PASS}`),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
