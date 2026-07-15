import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { OrderStatus } from '@prisma/client';
import { ORDERS_QUEUE } from './orders.constants';

interface StatusChangedJob {
  orderId: string;
  newStatus: OrderStatus;
}

/**
 * OrdersProcessor
 *
 * Handles async side-effects triggered by order status transitions.
 * Add real integrations (contract PDF, payment release trigger, etc.) here.
 */
@Processor(ORDERS_QUEUE)
export class OrdersProcessor {
  private readonly logger = new Logger(OrdersProcessor.name);

  @Process('status-changed')
  async handleStatusChanged(job: Job<StatusChangedJob>) {
    const { orderId, newStatus } = job.data;
    this.logger.log(`Order ${orderId} transitioned to ${newStatus}`);

    switch (newStatus) {
      case OrderStatus.CONTRACT_SIGNED:
        // TODO: trigger contract PDF generation / DocuSign integration
        this.logger.log(`[TODO] Generate contract PDF for order ${orderId}`);
        break;
      case OrderStatus.DELIVERED:
        // TODO: trigger escrow release prompt to buyer
        this.logger.log(
          `[TODO] Prompt buyer to confirm delivery and release funds for ${orderId}`,
        );
        break;
      default:
        break;
    }
  }
}
