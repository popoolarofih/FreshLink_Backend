import { OrderStatus } from '@prisma/client';
export declare const ORDERS_QUEUE = "orders";
export declare const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]>;
