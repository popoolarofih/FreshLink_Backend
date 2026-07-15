import { UpdateBuyerProfileDto } from './dto/update-buyer-profile.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class BuyersController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMe(user: any): Promise<({
        user: {
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
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
    }) | null>;
    updateMe(user: any, dto: UpdateBuyerProfileDto): Promise<({
        user: {
            id: string;
            email: string;
            emailVerifyToken: string | null;
            passwordHash: string;
            role: import(".prisma/client").$Enums.Role;
            firstName: string;
            lastName: string;
            phone: string | null;
            avatarUrl: string | null;
            isEmailVerified: boolean;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
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
    }) | null>;
}
