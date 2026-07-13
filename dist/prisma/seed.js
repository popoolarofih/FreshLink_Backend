"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const PASS = 'Password1!';
async function hash(pw) {
    return bcrypt.hash(pw, 12);
}
async function main() {
    console.log('🌱 Seeding FreshLink database...');
    const tagNames = ['vegan', 'halal', 'gluten-free', 'kosher', 'nut-free', 'cocktails', 'wine-pairing', 'organic'];
    const tags = await Promise.all(tagNames.map((name) => prisma.tag.upsert({ where: { name }, create: { name }, update: {} })));
    const tagMap = Object.fromEntries(tags.map((t) => [t.name, t.id]));
    console.log('  ✔ Tags created');
    const buyerData = [
        { email: 'amaka.okafor@example.com', firstName: 'Amaka', lastName: 'Okafor', buyerType: 'individual' },
        { email: 'heritage.hotel@example.com', firstName: 'Heritage', lastName: 'Hotel', buyerType: 'hotel', companyName: 'Heritage Boutique Hotel' },
        { email: 'techcorp.events@example.com', firstName: 'TechCorp', lastName: 'Events', buyerType: 'corporate', companyName: 'TechCorp Nigeria Ltd' },
    ];
    for (const b of buyerData) {
        await prisma.user.upsert({
            where: { email: b.email },
            create: {
                email: b.email,
                passwordHash: await hash(PASS),
                firstName: b.firstName,
                lastName: b.lastName,
                role: client_1.Role.BUYER,
                isEmailVerified: true,
                buyerProfile: {
                    create: {
                        buyerType: b.buyerType,
                        companyName: b.companyName,
                        city: 'Lagos',
                        country: 'NG',
                    },
                },
            },
            update: {},
        });
    }
    console.log('  ✔ Buyers created');
    const providerData = [
        {
            email: 'chidi.farm@example.com',
            firstName: 'Chidi',
            lastName: 'Eze',
            category: client_1.ProviderCategory.FARMER,
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
            category: client_1.ProviderCategory.CHEF,
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
            category: client_1.ProviderCategory.BAKER,
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
            category: client_1.ProviderCategory.CATERER,
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
            category: client_1.ProviderCategory.MEAL_PREP,
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
            category: client_1.ProviderCategory.BARTENDER,
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
                role: client_1.Role.PROVIDER,
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
        if (!profile)
            continue;
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
        for (const tagName of p.tags) {
            const tagId = tagMap[tagName];
            if (!tagId)
                continue;
            await prisma.providerTag.upsert({
                where: { providerProfileId_tagId: { providerProfileId: profile.id, tagId } },
                create: { providerProfileId: profile.id, tagId },
                update: {},
            });
        }
        for (let w = 1; w <= 4; w++) {
            const start = new Date();
            start.setDate(start.getDate() + w * 7);
            start.setHours(9, 0, 0, 0);
            const end = new Date(start);
            end.setHours(17, 0, 0, 0);
            await prisma.availabilitySlot.create({
                data: { providerProfileId: profile.id, startTime: start, endTime: end },
            }).catch(() => { });
        }
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
    allUsers.forEach((u) => console.log(`  ${u.resolvedRole} | ${u.email} | ${PASS}`));
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map