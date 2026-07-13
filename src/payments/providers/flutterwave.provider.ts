import { Injectable, Logger } from '@nestjs/common';
import {
  CaptureResult,
  CreatePaymentIntentParams,
  IPaymentProvider,
  PaymentIntentResult,
  RefundResult,
} from '../payment-provider.interface';

/**
 * FlutterwaveProvider – TODO
 *
 * Not wired up yet. Implement IPaymentProvider using Flutterwave's API
 * when ready and swap it in via the PAYMENT_PROVIDER token in payments.module.ts.
 *
 * Env var: FLUTTERWAVE_SECRET_KEY (marked TODO in .env.example)
 */
@Injectable()
export class FlutterwaveProvider implements IPaymentProvider {
  private readonly logger = new Logger(FlutterwaveProvider.name);

  async createPaymentIntent(
    _params: CreatePaymentIntentParams,
  ): Promise<PaymentIntentResult> {
    // TODO: implement using Flutterwave Transactions API
    throw new Error('FlutterwaveProvider not implemented yet.');
  }

  async capturePayment(_intentId: string): Promise<CaptureResult> {
    throw new Error('FlutterwaveProvider not implemented yet.');
  }

  async refundPayment(_chargeId: string, _amount?: number): Promise<RefundResult> {
    throw new Error('FlutterwaveProvider not implemented yet.');
  }
}
