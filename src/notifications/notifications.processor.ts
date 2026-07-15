import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NOTIFICATIONS_QUEUE } from './notifications.constants';
import { SendNotificationPayload } from './notifications.service';

/**
 * NotificationsProcessor
 *
 * Stub delivery processor.  Replace the console.log calls with real
 * push / SMS / email provider calls (FCM, Twilio, Resend, etc.) when ready.
 */
@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  @Process('deliver')
  async handleDeliver(
    job: Job<{ notificationId: string } & SendNotificationPayload>,
  ) {
    const { notificationId, userId, type, title, body } = job.data;
    // TODO: replace with real delivery providers
    this.logger.log(
      `[STUB] Delivering notification ${notificationId} to user ${userId} | type=${type} | "${title}": ${body}`,
    );
    // e.g. await this.pushService.send(userId, title, body);
    // e.g. await this.emailService.send(userId, title, body);
  }
}
