import { FavoritesService } from './favorites.service';
export declare class FavoritesController {
    private readonly favoritesService;
    constructor(favoritesService: FavoritesService);
    add(user: any, providerProfileId: string): Promise<{
        message: string;
    }>;
    remove(user: any, providerProfileId: string): Promise<{
        message: string;
    }>;
    listMine(user: any, page?: string, limit?: string): Promise<{
        data: {
            providerProfileId: string;
            businessName: string | null;
            category: import(".prisma/client").$Enums.ProviderCategory;
            city: string | null;
            averageRating: number;
            startingPrice: number | null;
            favoritedAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
