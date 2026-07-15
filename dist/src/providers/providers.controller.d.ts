import { ProvidersService } from './providers.service';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { AddPortfolioItemDto } from './dto/add-portfolio-item.dto';
import { AddPricingItemDto } from './dto/add-pricing-item.dto';
import { AddAvailabilitySlotDto } from './dto/add-availability-slot.dto';
export declare class ProvidersController {
    private readonly providersService;
    constructor(providersService: ProvidersService);
    getMyProfile(user: any): Promise<{
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
    updateMyProfile(user: any, dto: UpdateProviderProfileDto): Promise<{
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
    getProfile(id: string): Promise<{
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
    addPortfolioItem(user: any, dto: AddPortfolioItemDto): Promise<{
        id: string;
        createdAt: Date;
        providerProfileId: string;
        description: string | null;
        title: string;
        mediaUrl: string;
        mediaType: string;
    }>;
    removePortfolioItem(user: any, itemId: string): Promise<{
        id: string;
        createdAt: Date;
        providerProfileId: string;
        description: string | null;
        title: string;
        mediaUrl: string;
        mediaType: string;
    }>;
    addPricingItem(user: any, dto: AddPricingItemDto): Promise<{
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
    removePricingItem(user: any, itemId: string): Promise<{
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
    getPriceSuggestion(user: any, category: string, guestCount?: number, durationHours?: number, eventType?: string): Promise<import("../groq-client/groq-client.types").PriceSuggestion>;
    addSlot(user: any, dto: AddAvailabilitySlotDto): Promise<{
        id: string;
        createdAt: Date;
        providerProfileId: string;
        startTime: Date;
        endTime: Date;
        isBooked: boolean;
    }>;
    removeSlot(user: any, slotId: string): Promise<{
        id: string;
        createdAt: Date;
        providerProfileId: string;
        startTime: Date;
        endTime: Date;
        isBooked: boolean;
    }>;
}
