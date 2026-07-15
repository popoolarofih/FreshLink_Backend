import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
export interface SendNotificationPayload {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, unknown>;
}
export declare class NotificationsService {
    private readonly prisma;
    private readonly notifQueue;
    private readonly logger;
    constructor(prisma: PrismaService, notifQueue: Queue);
    send(payload: SendNotificationPayload): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        data: import("@prisma/client/runtime/client").JsonValue | null;
        title: string;
        type: import(".prisma/client").$Enums.NotificationType;
        body: string;
        isRead: boolean;
    }>;
    getForUser(userId: string, page?: number, limit?: number): Promise<{
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
    markRead(userId: string, notificationId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    markAllRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
