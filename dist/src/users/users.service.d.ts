import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<{
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        firstName: string;
        lastName: string;
        phone: string | null;
        avatarUrl: string | null;
        isEmailVerified: boolean;
        isActive: boolean;
        createdAt: Date;
        providerProfile: ({
            certifications: {
                id: string;
                name: string;
                createdAt: Date;
                providerProfileId: string;
                expiresAt: Date | null;
                issuingBody: string | null;
                issuedAt: Date | null;
                documentUrl: string | null;
            }[];
            portfolioItems: {
                id: string;
                createdAt: Date;
                providerProfileId: string;
                description: string | null;
                title: string;
                mediaUrl: string;
                mediaType: string;
            }[];
            pricingItems: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                providerProfileId: string;
                serviceName: string;
                description: string | null;
                basePrice: import("@prisma/client-runtime-utils").Decimal;
                currency: string;
                unit: string;
            }[];
            availabilitySlots: {
                id: string;
                createdAt: Date;
                providerProfileId: string;
                startTime: Date;
                endTime: Date;
                isBooked: boolean;
            }[];
            dietaryTags: ({
                tag: {
                    id: string;
                    name: string;
                };
            } & {
                providerProfileId: string;
                tagId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            city: string | null;
            country: string;
            category: import(".prisma/client").$Enums.ProviderCategory;
            bio: string | null;
            businessName: string | null;
            stateOrRegion: string | null;
            serviceRadiusKm: number;
            averageRating: number;
            totalReviews: number;
            completenessScore: number;
            isAvailable: boolean;
            allowsInstantBook: boolean;
            userId: string;
        }) | null;
        buyerProfile: {
            id: string;
            companyName: string | null;
            createdAt: Date;
            updatedAt: Date;
            buyerType: string;
            address: string | null;
            city: string | null;
            dietaryPreferences: string[];
            country: string;
            userId: string;
        } | null;
        subscription: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import(".prisma/client").$Enums.SubscriptionStatus;
            plan: import(".prisma/client").$Enums.SubscriptionPlan;
            expiresAt: Date;
            startedAt: Date;
            renewedAt: Date | null;
            cancelledAt: Date | null;
            stripeSubscriptionId: string | null;
            stripeCustomerId: string | null;
        } | null;
    }>;
    findAll(page?: number, limit?: number): Promise<{
        data: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            firstName: string;
            lastName: string;
            isActive: boolean;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    deactivate(id: string): Promise<{
        id: string;
        isActive: boolean;
    }>;
}
