import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { ListMessagesDto } from './dto/list-messages.dto';

/** Shared sender select used everywhere we include the sender object */
const SENDER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─────────────────────────────────────────────
  // Authorization helper — mirrors orders.service
  // ─────────────────────────────────────────────

  /**
   * Loads the order (with providerProfile.userId) and verifies the caller is
   * the buyer or the provider on that order.  Returns the order on success.
   * Throws NotFoundException / ForbiddenException otherwise.
   */
  private async assertOrderParticipant(orderId: string, callerId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        providerProfile: { select: { userId: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found.');

    const isBuyer = order.buyerId === callerId;
    const isProvider = order.providerProfile.userId === callerId;
    if (!isBuyer && !isProvider) throw new ForbiddenException();

    return { order, isBuyer, isProvider };
  }

  // ─────────────────────────────────────────────
  // POST /orders/:id/messages
  // ─────────────────────────────────────────────

  async sendMessage(orderId: string, senderId: string, dto: CreateMessageDto) {
    const { order, isBuyer } = await this.assertOrderParticipant(
      orderId,
      senderId,
    );

    const message = await this.prisma.message.create({
      data: {
        orderId,
        senderId,
        content: dto.content,
      },
      include: { sender: { select: SENDER_SELECT } },
    });

    // Notify the other party
    const recipientId = isBuyer ? order.providerProfile.userId : order.buyerId;

    await this.notifications.send({
      userId: recipientId,
      type: NotificationType.NEW_MESSAGE,
      title: 'New message',
      body:
        dto.content.length > 80 ? dto.content.slice(0, 80) + '…' : dto.content,
      data: { orderId, messageId: message.id },
    });

    return message;
  }

  // ─────────────────────────────────────────────
  // GET /orders/:id/messages
  // ─────────────────────────────────────────────

  async listMessages(
    orderId: string,
    callerId: string,
    query: ListMessagesDto,
  ) {
    await this.assertOrderParticipant(orderId, callerId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { orderId },
        orderBy: { createdAt: 'asc' }, // oldest-first; see Swagger description
        skip,
        take: limit,
        include: { sender: { select: SENDER_SELECT } },
      }),
      this.prisma.message.count({ where: { orderId } }),
    ]);

    return { data: messages, total, page, limit };
  }

  // ─────────────────────────────────────────────
  // PATCH /orders/:id/messages/read
  // ─────────────────────────────────────────────

  async markThreadRead(orderId: string, callerId: string) {
    await this.assertOrderParticipant(orderId, callerId);

    const result = await this.prisma.message.updateMany({
      where: {
        orderId,
        senderId: { not: callerId }, // only messages the caller received
        readAt: null, // only unread ones
      },
      data: { readAt: new Date() },
    });

    return { markedRead: result.count };
  }
}
