export declare class MessageSenderDto {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
}
export declare class MessageResponseDto {
    id: string;
    orderId: string;
    senderId: string;
    sender: MessageSenderDto;
    content: string;
    createdAt: Date;
    readAt: Date | null;
}
export declare class MessageListResponseDto {
    data: MessageResponseDto[];
    total: number;
    page: number;
    limit: number;
}
