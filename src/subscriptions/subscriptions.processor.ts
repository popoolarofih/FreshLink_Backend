import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { SUBSCRIPTIONS_QUEUE } from './subscriptions.constants';
import { SubscriptionsService } from './subscriptions.service';

/**
 * SubscriptionsProcessor
 *
 * Handles BullMQ cron jobs for subscription lifecycle:
 * - check-expirations: expire ACTIVE subs past their expiresAt
 * - send-reminders:    notify users 3 days before expiry
 */
@Processor(SUBSCRIPTIONS_QUEUE)
export class SubscriptionsProcessor {
  private readonly logger = new Logger(SubscriptionsProcessor.name);

  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Process('check-expirations')
  async handleExpirations(_job: Job) {
    this.logger.log('Running subscription expiration check...');
    const result = await this.subscriptionsService.processRenewals();
    this.logger.log(`Expired ${result.processed} subscription(s).`);
  }

  @Process('send-reminders')
  async handleReminders(_job: Job) {
    this.logger.log('Running subscription renewal reminders...');
    const result =
      await this.subscriptionsService.processUpcomingRenewalReminders();
    this.logger.log(`Sent ${result.reminded} renewal reminder(s).`);
  }
}
