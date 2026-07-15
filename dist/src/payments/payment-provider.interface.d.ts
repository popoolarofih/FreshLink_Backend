export interface CreatePaymentIntentParams {
    amount: number;
    currency: string;
    orderId: string;
    customerId?: string;
    metadata?: Record<string, string>;
}
export interface PaymentIntentResult {
    providerIntentId: string;
    clientSecret?: string;
    status: string;
}
export interface CaptureResult {
    providerChargeId: string;
    status: string;
}
export interface RefundResult {
    refundId: string;
    status: string;
}
export interface IPaymentProvider {
    createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
    capturePayment(intentId: string): Promise<CaptureResult>;
    refundPayment(chargeId: string, amount?: number): Promise<RefundResult>;
}
