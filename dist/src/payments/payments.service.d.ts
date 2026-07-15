import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StripeProvider } from './providers/stripe.provider';
import { CreatePaymentDto } from './dto/create-payment.dto';
export declare class PaymentsService {
    private readonly prisma;
    private readonly notifications;
    private readonly stripe;
    constructor(prisma: PrismaService, notifications: NotificationsService, stripe: StripeProvider);
    initiatePayment(buyerId: string, dto: CreatePaymentDto): Promise<{
        payment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            currency: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            amount: import("@prisma/client-runtime-utils").Decimal;
            orderId: string;
            stripePaymentIntentId: string | null;
            stripeChargeId: string | null;
            flutterwaveRef: string | null;
            provider: string;
            heldAt: Date | null;
            releasedAt: Date | null;
            refundedAt: Date | null;
        };
        clientSecret: string | undefined;
    }>;
    markHeld(stripePaymentIntentId: string): Promise<void>;
    releaseFunds(orderId: string, buyerId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        amount: import("@prisma/client-runtime-utils").Decimal;
        orderId: string;
        stripePaymentIntentId: string | null;
        stripeChargeId: string | null;
        flutterwaveRef: string | null;
        provider: string;
        heldAt: Date | null;
        releasedAt: Date | null;
        refundedAt: Date | null;
    }>;
    refund(orderId: string, requesterId: string): Promise<{
        payment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            currency: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            amount: import("@prisma/client-runtime-utils").Decimal;
            orderId: string;
            stripePaymentIntentId: string | null;
            stripeChargeId: string | null;
            flutterwaveRef: string | null;
            provider: string;
            heldAt: Date | null;
            releasedAt: Date | null;
            refundedAt: Date | null;
        };
        refundId: string;
    }>;
    getPaymentByOrder(orderId: string, requesterId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        amount: import("@prisma/client-runtime-utils").Decimal;
        orderId: string;
        stripePaymentIntentId: string | null;
        stripeChargeId: string | null;
        flutterwaveRef: string | null;
        provider: string;
        heldAt: Date | null;
        releasedAt: Date | null;
        refundedAt: Date | null;
    } | null>;
}
