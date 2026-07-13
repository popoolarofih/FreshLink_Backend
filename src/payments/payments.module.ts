import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeProvider } from './providers/stripe.provider';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PaymentsController, StripeWebhookController],
  providers: [
    PaymentsService,
    StripeProvider,
    // To switch to Flutterwave: replace StripeProvider with FlutterwaveProvider
    // and inject via IPaymentProvider token
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
