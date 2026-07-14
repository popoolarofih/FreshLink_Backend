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
        userId: string;
        companyName: string | null;
        buyerType: string;
        address: string | null;
        city: string | null;
        dietaryPreferences: string[];
        country: string;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    updateMe(user: any, dto: UpdateBuyerProfileDto): Promise<({
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            passwordHash: string;
            role: import(".prisma/client").$Enums.Role;
            firstName: string;
            lastName: string;
            phone: string | null;
            avatarUrl: string | null;
            isEmailVerified: boolean;
            emailVerifyToken: string | null;
            isActive: boolean;
        };
    } & {
        id: string;
        userId: string;
        companyName: string | null;
        buyerType: string;
        address: string | null;
        city: string | null;
        dietaryPreferences: string[];
        country: string;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
}
