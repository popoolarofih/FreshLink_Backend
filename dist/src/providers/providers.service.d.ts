import { PrismaService } from '../prisma/prisma.service';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { AddPortfolioItemDto } from './dto/add-portfolio-item.dto';
import { AddPricingItemDto } from './dto/add-pricing-item.dto';
import { AddAvailabilitySlotDto } from './dto/add-availability-slot.dto';
import { PricingService } from '../pricing/pricing.service';
export declare class ProvidersService {
    private readonly prisma;
    private readonly pricingService;
    constructor(prisma: PrismaService, pricingService: PricingService);
    getPriceSuggestion(userId: string, category: string, guestCount?: number, durationHours?: number, eventType?: string): Promise<import("../groq-client/groq-client.types").PriceSuggestion>;
    getProfile(userId: string): Promise<{
        user: {
            email: string;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        };
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
    }>;
    getProfileById(id: string): Promise<{
        user: {
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        };
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
    }>;
    getEarnings(userId: string, page: number, limit: number): Promise<{
        totalHeld: number;
        totalReleased: number;
        totalRefunded: number;
        currency: string;
        recentPayments: {
            orderId: string;
            amount: number;
            status: import(".prisma/client").$Enums.PaymentStatus;
            currency: string;
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    updateProfile(userId: string, dto: UpdateProviderProfileDto): Promise<{
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
    }>;
    private computeCompletenessScore;
    addPortfolioItem(userId: string, dto: AddPortfolioItemDto): Promise<{
        id: string;
        createdAt: Date;
        providerProfileId: string;
        description: string | null;
        title: string;
        mediaUrl: string;
        mediaType: string;
    }>;
    removePortfolioItem(userId: string, itemId: string): Promise<{
        id: string;
        createdAt: Date;
        providerProfileId: string;
        description: string | null;
        title: string;
        mediaUrl: string;
        mediaType: string;
    }>;
    addPricingItem(userId: string, dto: AddPricingItemDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        providerProfileId: string;
        serviceName: string;
        description: string | null;
        basePrice: import("@prisma/client-runtime-utils").Decimal;
        currency: string;
        unit: string;
    }>;
    removePricingItem(userId: string, itemId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        providerProfileId: string;
        serviceName: string;
        description: string | null;
        basePrice: import("@prisma/client-runtime-utils").Decimal;
        currency: string;
        unit: string;
    }>;
    addAvailabilitySlot(userId: string, dto: AddAvailabilitySlotDto): Promise<{
        id: string;
        createdAt: Date;
        providerProfileId: string;
        startTime: Date;
        endTime: Date;
        isBooked: boolean;
    }>;
    removeAvailabilitySlot(userId: string, slotId: string): Promise<{
        id: string;
        createdAt: Date;
        providerProfileId: string;
        startTime: Date;
        endTime: Date;
        isBooked: boolean;
    }>;
}
