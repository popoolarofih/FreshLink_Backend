import { ProviderCategory } from '@prisma/client';
export declare class ParsedFiltersDto {
    category?: ProviderCategory;
    cuisineTags?: string[];
    dietaryTags?: string[];
    dateFrom?: string;
    dateTo?: string;
    maxPrice?: number;
    eventType?: string;
    location?: string;
    confidence?: number;
}
