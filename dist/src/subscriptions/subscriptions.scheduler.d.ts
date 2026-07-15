import { OnModuleInit } from '@nestjs/common';
import { Queue } from 'bull';
export declare class SubscriptionsScheduler implements OnModuleInit {
    private readonly queue;
    private readonly logger;
    constructor(queue: Queue);
    onModuleInit(): Promise<void>;
}
