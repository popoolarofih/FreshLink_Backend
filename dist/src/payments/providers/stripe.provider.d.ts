import { ConfigService } from '@nestjs/config';
import { CaptureResult, CreatePaymentIntentParams, IPaymentProvider, PaymentIntentResult, RefundResult } from '../payment-provider.interface';
export declare class StripeProvider implements IPaymentProvider {
    private readonly config;
    private readonly logger;
    private readonly stripe;
    constructor(config: ConfigService);
    createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
    capturePayment(intentId: string): Promise<CaptureResult>;
    refundPayment(chargeId: string, amount?: number): Promise<RefundResult>;
}
