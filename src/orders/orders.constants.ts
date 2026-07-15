import { OrderStatus } from '@prisma/client';

export const ORDERS_QUEUE = 'orders';

/**
 * Valid state machine transitions for an Order.
 * Key = current status, Value = allowed next statuses.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.REQUESTED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.CONTRACT_SIGNED, OrderStatus.CANCELLED],
  [OrderStatus.CONTRACT_SIGNED]: [
    OrderStatus.IN_PROGRESS,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.IN_PROGRESS]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.REVIEWED],
  [OrderStatus.REVIEWED]: [],
  [OrderStatus.CANCELLED]: [],
};
