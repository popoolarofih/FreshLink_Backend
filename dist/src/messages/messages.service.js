"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const SENDER_SELECT = {
    id: true,
    firstName: true,
    lastName: true,
    avatarUrl: true,
};
let MessagesService = class MessagesService {
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async assertOrderParticipant(orderId, callerId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                providerProfile: { select: { userId: true } },
            },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found.');
        const isBuyer = order.buyerId === callerId;
        const isProvider = order.providerProfile.userId === callerId;
        if (!isBuyer && !isProvider)
            throw new common_1.ForbiddenException();
        return { order, isBuyer, isProvider };
    }
    async sendMessage(orderId, senderId, dto) {
        const { order, isBuyer } = await this.assertOrderParticipant(orderId, senderId);
        const message = await this.prisma.message.create({
            data: {
                orderId,
                senderId,
                content: dto.content,
            },
            include: { sender: { select: SENDER_SELECT } },
        });
        const recipientId = isBuyer ? order.providerProfile.userId : order.buyerId;
        await this.notifications.send({
            userId: recipientId,
            type: client_1.NotificationType.NEW_MESSAGE,
            title: 'New message',
            body: dto.content.length > 80 ? dto.content.slice(0, 80) + '…' : dto.content,
            data: { orderId, messageId: message.id },
        });
        return message;
    }
    async listMessages(orderId, callerId, query) {
        await this.assertOrderParticipant(orderId, callerId);
        const page = query.page ?? 1;
        const limit = query.limit ?? 50;
        const skip = (page - 1) * limit;
        const [messages, total] = await Promise.all([
            this.prisma.message.findMany({
                where: { orderId },
                orderBy: { createdAt: 'asc' },
                skip,
                take: limit,
                include: { sender: { select: SENDER_SELECT } },
            }),
            this.prisma.message.count({ where: { orderId } }),
        ]);
        return { data: messages, total, page, limit };
    }
    async markThreadRead(orderId, callerId) {
        await this.assertOrderParticipant(orderId, callerId);
        const result = await this.prisma.message.updateMany({
            where: {
                orderId,
                senderId: { not: callerId },
                readAt: null,
            },
            data: { readAt: new Date() },
        });
        return { markedRead: result.count };
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map