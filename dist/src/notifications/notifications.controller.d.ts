import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getMyNotifications(user: any, page?: number, limit?: number): Promise<{
        data: {
            id: string;
            createdAt: Date;
            userId: string;
            data: import("@prisma/client/runtime/client").JsonValue | null;
            title: string;
            type: import(".prisma/client").$Enums.NotificationType;
            body: string;
            isRead: boolean;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    markRead(user: any, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markAllRead(user: any): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
