/**
 * IPaymentProvider
 *
 * Shared interface implemented by all payment providers (Stripe, Flutterwave, etc.).
 * Swap providers without touching service logic.
 */
export interface CreatePaymentIntentParams {
  amount: number; // in smallest currency unit (kobo, cents)
  currency: string;
  orderId: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  providerIntentId: string;
  clientSecret?: string; // Stripe client_secret for front-end confirmation
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
  createPaymentIntent(
    params: CreatePaymentIntentParams,
  ): Promise<PaymentIntentResult>;
  capturePayment(intentId: string): Promise<CaptureResult>;
  refundPayment(chargeId: string, amount?: number): Promise<RefundResult>;
}
