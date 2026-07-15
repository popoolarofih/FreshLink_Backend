import { PrismaService } from '../prisma/prisma.service';
export declare class BuyersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAnalytics(userId: string, range: string): Promise<{
        spend: {
            date: string;
            amount: number;
        }[];
        ordersByCategory: {
            category: string;
            count: number;
        }[];
        totalSpend: number;
        totalOrders: number;
    }>;
    getReorderHistory(userId: string): Promise<{
        providerProfileId: string;
        providerName: string;
        category: string;
        lastOrderedAt: Date;
        orderCount: number;
    }[]>;
}
