import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  CaptureResult,
  CreatePaymentIntentParams,
  IPaymentProvider,
  PaymentIntentResult,
  RefundResult,
} from '../payment-provider.interface';

@Injectable()
export class StripeProvider implements IPaymentProvider {
  private readonly logger = new Logger(StripeProvider.name);
  private readonly stripe: Stripe;

  constructor(private readonly config: ConfigService) {
    this.stripe = new Stripe(
      config.get<string>('STRIPE_SECRET_KEY', 'sk_test_placeholder'),
      { apiVersion: '2026-06-24.dahlia' },
    );
  }

  async createPaymentIntent(
    params: CreatePaymentIntentParams,
  ): Promise<PaymentIntentResult> {
    const intent = await this.stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency.toLowerCase(),
      capture_method: 'manual', // hold funds, release manually on DELIVERED
      metadata: { orderId: params.orderId, ...params.metadata },
      ...(params.customerId && { customer: params.customerId }),
    });

    return {
      providerIntentId: intent.id,
      clientSecret: intent.client_secret ?? undefined,
      status: intent.status,
    };
  }

  async capturePayment(intentId: string): Promise<CaptureResult> {
    const intent = await this.stripe.paymentIntents.capture(intentId);
    return {
      providerChargeId: intent.latest_charge as string,
      status: intent.status,
    };
  }

  async refundPayment(chargeId: string, amount?: number): Promise<RefundResult> {
    const refund = await this.stripe.refunds.create({
      charge: chargeId,
      ...(amount !== undefined && { amount }),
    });
    return { refundId: refund.id, status: refund.status ?? 'unknown' };
  }
}
