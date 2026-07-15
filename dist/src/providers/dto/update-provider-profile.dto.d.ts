import { ProviderCategory } from '@prisma/client';
export declare class UpdateProviderProfileDto {
    category?: ProviderCategory;
    bio?: string;
    businessName?: string;
    city?: string;
    stateOrRegion?: string;
    country?: string;
    serviceRadiusKm?: number;
    isAvailable?: boolean;
    allowsInstantBook?: boolean;
    tags?: string[];
}
