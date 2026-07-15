import { ProviderCategory } from '@prisma/client';
export declare class SearchProvidersDto {
    q?: string;
    category?: ProviderCategory;
    city?: string;
    minPrice?: number;
    minRating?: number;
    maxPrice?: number;
    rating?: number;
    tags?: string[];
    availableFrom?: string;
    availableTo?: string;
    sortBy?: 'rating' | 'price' | 'ai';
    page?: number;
    limit?: number;
}
