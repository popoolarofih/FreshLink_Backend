import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
export declare class SubscriptionsController {
    private readonly subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    createOrUpgrade(user: any, dto: CreateSubscriptionDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        expiresAt: Date;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        startedAt: Date;
        renewedAt: Date | null;
        cancelledAt: Date | null;
        stripeSubscriptionId: string | null;
        stripeCustomerId: string | null;
    }>;
    getMySubscription(user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        expiresAt: Date;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        startedAt: Date;
        renewedAt: Date | null;
        cancelledAt: Date | null;
        stripeSubscriptionId: string | null;
        stripeCustomerId: string | null;
    }>;
    cancel(user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        expiresAt: Date;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        startedAt: Date;
        renewedAt: Date | null;
        cancelledAt: Date | null;
        stripeSubscriptionId: string | null;
        stripeCustomerId: string | null;
    }>;
}
