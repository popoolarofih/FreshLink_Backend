import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ListMessagesDto } from './dto/list-messages.dto';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    sendMessage(user: any, orderId: string, dto: CreateMessageDto): Promise<{
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
    listMessages(user: any, orderId: string, query: ListMessagesDto): Promise<{
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
    markRead(user: any, orderId: string): Promise<{
        markedRead: number;
    }>;
}
