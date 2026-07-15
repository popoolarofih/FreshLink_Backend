import { CaptureResult, CreatePaymentIntentParams, IPaymentProvider, PaymentIntentResult, RefundResult } from '../payment-provider.interface';
export declare class FlutterwaveProvider implements IPaymentProvider {
    private readonly logger;
    createPaymentIntent(_params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
    capturePayment(_intentId: string): Promise<CaptureResult>;
    refundPayment(_chargeId: string, _amount?: number): Promise<RefundResult>;
}
