import { Job } from 'bull';
import { SendNotificationPayload } from './notifications.service';
export declare class NotificationsProcessor {
    private readonly logger;
    handleDeliver(job: Job<{
        notificationId: string;
    } & SendNotificationPayload>): Promise<void>;
}
