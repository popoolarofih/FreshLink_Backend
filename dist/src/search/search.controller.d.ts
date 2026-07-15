import { SearchService } from './search.service';
import { SearchProvidersDto } from './dto/search-providers.dto';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    searchProviders(dto: SearchProvidersDto, req: any): Promise<{
        data: ({
            user: {
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            };
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
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
