import { PrismaService } from '../prisma/prisma.service';
export declare class FavoritesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    add(buyerId: string, providerProfileId: string): Promise<{
        message: string;
    }>;
    remove(buyerId: string, providerProfileId: string): Promise<{
        message: string;
    }>;
    listMine(buyerId: string, page: number, limit: number): Promise<{
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
