import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsProcessor } from './subscriptions.processor';
import { SubscriptionsScheduler } from './subscriptions.scheduler';
import { NotificationsModule } from '../notifications/notifications.module';
import { SUBSCRIPTIONS_QUEUE } from './subscriptions.constants';

@Module({
  imports: [
    BullModule.registerQueue({ name: SUBSCRIPTIONS_QUEUE }),
    NotificationsModule,
  ],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsService,
    SubscriptionsProcessor,
    SubscriptionsScheduler,
  ],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
