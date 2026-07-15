import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
export declare class SubscriptionsController {
    private readonly subscriptionsService;
    constructor(subscriptionsService: SubscriptionsService);
    getPlans(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.SubscriptionPlan;
        priceMonthly: import("@prisma/client-runtime-utils").Decimal;
        features: string[];
    }[]>;
    createOrUpgrade(user: any, dto: CreateSubscriptionDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.SubscriptionStatus;
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        expiresAt: Date;
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
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        expiresAt: Date;
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
        plan: import(".prisma/client").$Enums.SubscriptionPlan;
        expiresAt: Date;
        startedAt: Date;
        renewedAt: Date | null;
        cancelledAt: Date | null;
        stripeSubscriptionId: string | null;
        stripeCustomerId: string | null;
    }>;
}
