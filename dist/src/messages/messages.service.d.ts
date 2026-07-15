import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ListMessagesDto } from './dto/list-messages.dto';
export declare class MessagesService {
    private readonly prisma;
    private readonly notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    private assertOrderParticipant;
    sendMessage(orderId: string, senderId: string, dto: CreateMessageDto): Promise<{
        sender: {
            id: string;
            firstName: string;
            lastName: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        orderId: string;
        content: string;
        readAt: Date | null;
        senderId: string;
    }>;
    listMessages(orderId: string, callerId: string, query: ListMessagesDto): Promise<{
        data: ({
            sender: {
                id: string;
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            orderId: string;
            content: string;
            readAt: Date | null;
            senderId: string;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    markThreadRead(orderId: string, callerId: string): Promise<{
        markedRead: number;
    }>;
}
