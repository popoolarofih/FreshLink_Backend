import { Job } from 'bull';
import { OrderStatus } from '@prisma/client';
interface StatusChangedJob {
    orderId: string;
    newStatus: OrderStatus;
}
export declare class OrdersProcessor {
    private readonly logger;
    handleStatusChanged(job: Job<StatusChangedJob>): Promise<void>;
}
export {};
