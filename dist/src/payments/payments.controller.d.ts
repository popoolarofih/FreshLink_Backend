import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    initiatePayment(user: any, dto: CreatePaymentDto): Promise<{
        payment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            currency: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            orderId: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
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
    getPayment(user: any, orderId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        orderId: string;
        amount: import("@prisma/client-runtime-utils").Decimal;
        stripePaymentIntentId: string | null;
        stripeChargeId: string | null;
        flutterwaveRef: string | null;
        provider: string;
        heldAt: Date | null;
        releasedAt: Date | null;
        refundedAt: Date | null;
    } | null>;
    releaseFunds(user: any, orderId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        orderId: string;
        amount: import("@prisma/client-runtime-utils").Decimal;
        stripePaymentIntentId: string | null;
        stripeChargeId: string | null;
        flutterwaveRef: string | null;
        provider: string;
        heldAt: Date | null;
        releasedAt: Date | null;
        refundedAt: Date | null;
    }>;
    refund(user: any, orderId: string): Promise<{
        payment: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            currency: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            orderId: string;
            amount: import("@prisma/client-runtime-utils").Decimal;
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
}
