import { Job } from 'bull';
import { SubscriptionsService } from './subscriptions.service';
export declare class SubscriptionsProcessor {
    private readonly subscriptionsService;
    private readonly logger;
    constructor(subscriptionsService: SubscriptionsService);
    handleExpirations(_job: Job): Promise<void>;
    handleReminders(_job: Job): Promise<void>;
}
