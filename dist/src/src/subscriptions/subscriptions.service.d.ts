import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
export declare class SubscriptionsService {
    private readonly prisma;
    private readonly notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    createOrUpgrade(userId: string, dto: CreateSubscriptionDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        expiresAt: Date;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        stripeSubscriptionId: string | null;
        startedAt: Date;
        renewedAt: Date | null;
        cancelledAt: Date | null;
        stripeCustomerId: string | null;
    }>;
    getMySubscription(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        expiresAt: Date;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        stripeSubscriptionId: string | null;
        startedAt: Date;
        renewedAt: Date | null;
        cancelledAt: Date | null;
        stripeCustomerId: string | null;
    }>;
    cancel(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        expiresAt: Date;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        stripeSubscriptionId: string | null;
        startedAt: Date;
        renewedAt: Date | null;
        cancelledAt: Date | null;
        stripeCustomerId: string | null;
    }>;
    processRenewals(): Promise<{
        processed: number;
    }>;
    processUpcomingRenewalReminders(): Promise<{
        reminded: number;
    }>;
}
