import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SUBSCRIPTIONS_QUEUE } from './subscriptions.constants';

/**
 * SubscriptionsScheduler
 *
 * Registers repeatable cron jobs on module init so they survive restarts.
 * Uses BullMQ's built-in repeat/cron support.
 */
@Injectable()
export class SubscriptionsScheduler implements OnModuleInit {
  private readonly logger = new Logger(SubscriptionsScheduler.name);

  constructor(
    @InjectQueue(SUBSCRIPTIONS_QUEUE) private readonly queue: Queue,
  ) {}

  async onModuleInit() {
    // Run daily at midnight
    await this.queue.add(
      'check-expirations',
      {},
      { repeat: { cron: '0 0 * * *' }, jobId: 'sub-expiry-cron' },
    );

    // Run daily at 09:00
    await this.queue.add(
      'send-reminders',
      {},
      { repeat: { cron: '0 9 * * *' }, jobId: 'sub-reminder-cron' },
    );

    this.logger.log('Subscription cron jobs registered.');
  }
}
