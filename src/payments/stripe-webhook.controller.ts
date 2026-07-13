import {
  BadRequestException,
  Controller,
  Headers,
  Logger,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request } from 'express';
import Stripe from 'stripe';
import { PaymentsService } from './payments.service';

/**
 * StripeWebhookController
 *
 * Handles inbound Stripe webhook events. Mounted at /api/v1/payments/webhook.
 * Uses the raw request body for signature verification — NestFactory must be
 * created with { rawBody: true } (already set in main.ts).
 *
 * Register this URL in your Stripe Dashboard → Developers → Webhooks.
 * Events to listen for:
 *   - payment_intent.amount_capturable_updated  (card authorised → mark HELD)
 *   - payment_intent.payment_failed             (log / notify buyer)
 */
@ApiExcludeController()
@Controller('payments/webhook')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly config: ConfigService,
  ) {
    this.stripe = new Stripe(
      config.get<string>('STRIPE_SECRET_KEY', 'sk_test_placeholder'),
      { apiVersion: '2026-06-24.dahlia' },
    );
    this.webhookSecret = config.get<string>('STRIPE_WEBHOOK_SECRET', '');
  }

  @Post()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    if (!this.webhookSecret) {
      this.logger.warn('STRIPE_WEBHOOK_SECRET not set — skipping signature verification');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody!,
        sig,
        this.webhookSecret,
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${(err as Error).message}`);
      throw new BadRequestException('Invalid Stripe webhook signature.');
    }

    this.logger.log(`Stripe event received: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.amount_capturable_updated': {
        // Card authorised and funds are on hold — mark payment as HELD
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.paymentsService.markHeld(pi.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        this.logger.warn(`Payment failed for intent ${pi.id}: ${pi.last_payment_error?.message}`);
        // TODO: notify buyer via NotificationsService
        break;
      }

      default:
        this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
    }

    return { received: true };
  }
}
