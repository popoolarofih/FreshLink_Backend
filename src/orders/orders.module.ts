import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrdersProcessor } from './orders.processor';
import { NotificationsModule } from '../notifications/notifications.module';
import { ORDERS_QUEUE } from './orders.constants';
import { ContractsModule } from './contracts/contracts.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: ORDERS_QUEUE }),
    NotificationsModule,
    ContractsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersProcessor],
  exports: [OrdersService],
})
export class OrdersModule {}
