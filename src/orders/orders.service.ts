import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ContractsService } from './contracts/contracts.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CounterOfferDto } from './dto/counter-offer.dto';
import { ORDER_TRANSITIONS, ORDERS_QUEUE } from './orders.constants';
import { NotificationType, OrderStatus, Role } from '@prisma/client';
import { ContractCategory } from '../groq-client/groq-client.types';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly contractsService: ContractsService,
    @InjectQueue(ORDERS_QUEUE) private readonly ordersQueue: Queue,
  ) {}

  // ─────────────────────────────────────────────
  // Create / Request
  // ─────────────────────────────────────────────

  async createOrder(buyerId: string, dto: CreateOrderDto) {
    const provider = await this.prisma.providerProfile.findUnique({
      where: { id: dto.providerProfileId },
      include: { user: { select: { id: true, firstName: true } } },
    });
    if (!provider) throw new NotFoundException('Provider not found.');

    const isInstantBooking = provider.allowsInstantBook && !dto.initialQuote;

    const order = await this.prisma.order.create({
      data: {
        buyerId,
        providerProfileId: dto.providerProfileId,
        serviceDescription: dto.serviceDescription,
        eventDate: dto.eventDate,
        guestCount: dto.guestCount,
        location: dto.location,
        initialQuote: dto.initialQuote,
        currency: dto.currency ?? 'NGN',
        specialRequirements: dto.specialRequirements,
        isInstantBooking,
        status: isInstantBooking ? OrderStatus.CONFIRMED : OrderStatus.REQUESTED,
        statusHistory: {
          create: {
            toStatus: isInstantBooking ? OrderStatus.CONFIRMED : OrderStatus.REQUESTED,
            note: isInstantBooking ? 'Instant booking' : 'Order requested',
          },
        },
      },
    });

    // Notify provider
    await this.notifications.send({
      userId: provider.user.id,
      type: NotificationType.ORDER_STATUS_CHANGE,
      title: 'New booking request',
      body: `You have a new ${isInstantBooking ? 'instant booking' : 'quote request'} for: ${dto.serviceDescription}`,
      data: { orderId: order.id },
    });

    return order;
  }

  // ─────────────────────────────────────────────
  // Get orders
  // ─────────────────────────────────────────────

  async getOrderById(orderId: string, requesterId: string, requesterRole: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        providerProfile: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
        statusHistory: { orderBy: { changedAt: 'asc' } },
        payment: true,
        review: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found.');

    const isOwner =
      order.buyerId === requesterId ||
      order.providerProfile.userId === requesterId ||
      requesterRole === Role.ADMIN;

    if (!isOwner) throw new ForbiddenException();
    return order;
  }

  async getBuyerOrders(buyerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { buyerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          providerProfile: {
            include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
          },
          payment: true,
        },
      }),
      this.prisma.order.count({ where: { buyerId } }),
    ]);
    return { data: orders, total, page, limit };
  }

  async getProviderOrders(userId: string, page = 1, limit = 20) {
    const profile = await this.prisma.providerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Provider profile not found.');

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { providerProfileId: profile.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          payment: true,
          statusHistory: { orderBy: { changedAt: 'desc' }, take: 1 },
        },
      }),
      this.prisma.order.count({ where: { providerProfileId: profile.id } }),
    ]);
    return { data: orders, total, page, limit };
  }

  // ─────────────────────────────────────────────
  // State machine transition
  // ─────────────────────────────────────────────

  async updateStatus(
    orderId: string,
    requesterId: string,
    requesterRole: Role,
    dto: UpdateOrderStatusDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        providerProfile: { include: { user: true } },
        buyer: { select: { id: true, email: true, firstName: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found.');

    // Auth check
    const isProvider = order.providerProfile.userId === requesterId;
    const isBuyer = order.buyerId === requesterId;
    const isAdmin = requesterRole === Role.ADMIN;
    if (!isProvider && !isBuyer && !isAdmin) throw new ForbiddenException();

    // State machine check
    const allowed = ORDER_TRANSITIONS[order.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Transition from ${order.status} → ${dto.status} is not allowed. ` +
          `Valid next states: [${allowed.join(', ')}]`,
      );
    }

    let isSignedByBuyer = order.isSignedByBuyer;
    let isSignedByProvider = order.isSignedByProvider;
    let targetStatus = order.status;
    let shouldAdvance = true;

    if (dto.status === OrderStatus.CONTRACT_SIGNED) {
      if (isBuyer) isSignedByBuyer = true;
      if (isProvider) isSignedByProvider = true;
      if (isAdmin) {
        isSignedByBuyer = true;
        isSignedByProvider = true;
      }

      if (isSignedByBuyer && isSignedByProvider) {
        targetStatus = OrderStatus.CONTRACT_SIGNED;
      } else {
        shouldAdvance = false;
      }
    } else {
      targetStatus = dto.status;
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: targetStatus,
        isSignedByBuyer,
        isSignedByProvider,
        ...(targetStatus === OrderStatus.CONTRACT_SIGNED && { contractSignedAt: new Date() }),
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: targetStatus,
            note: shouldAdvance
              ? dto.note || `Order status updated to ${targetStatus}`
              : isBuyer
              ? 'Contract signed by buyer (awaiting provider signature)'
              : 'Contract signed by provider (awaiting buyer signature)',
          },
        },
      },
      include: {
        providerProfile: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
        statusHistory: { orderBy: { changedAt: 'asc' } },
        payment: true,
        review: true,
      },
    });

    if (shouldAdvance) {
      // Notify both parties
      const notifyUserId =
        isProvider ? order.buyerId : order.providerProfile.userId;
      await this.notifications.send({
        userId: notifyUserId,
        type: NotificationType.ORDER_STATUS_CHANGE,
        title: 'Order status updated',
        body: `Order status changed to ${targetStatus}.`,
        data: { orderId },
      });

      // Enqueue any side effects (contract generation, payment triggers)
      await this.ordersQueue.add('status-changed', { orderId, newStatus: targetStatus });
    } else {
      // Notify the counterparty about the signature
      const notifyUserId =
        isBuyer ? order.providerProfile.userId : order.buyerId;
      await this.notifications.send({
        userId: notifyUserId,
        type: NotificationType.ORDER_STATUS_CHANGE,
        title: 'Contract signature updated',
        body: isBuyer
          ? 'The buyer has signed the contract. Awaiting your signature.'
          : 'The provider has signed the contract. Awaiting your signature.',
        data: { orderId },
      });
    }

    return updated;
  }

  // ─────────────────────────────────────────────
  // Counter-offer flow
  // ─────────────────────────────────────────────

  async submitCounterOffer(orderId: string, providerId: string, dto: CounterOfferDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { providerProfile: true },
    });
    if (!order) throw new NotFoundException('Order not found.');
    if (order.providerProfile.userId !== providerId) throw new ForbiddenException();
    if (order.status !== OrderStatus.REQUESTED) {
      throw new BadRequestException('Counter-offers can only be made on REQUESTED orders.');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { counterOffer: dto.amount },
    });

    await this.notifications.send({
      userId: order.buyerId,
      type: NotificationType.ORDER_STATUS_CHANGE,
      title: 'Counter-offer received',
      body: `The provider has made a counter-offer of ${dto.amount} ${order.currency}.`,
      data: { orderId },
    });

    return updated;
  }

  async acceptCounterOffer(orderId: string, buyerId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException();
    if (order.buyerId !== buyerId) throw new ForbiddenException();
    if (!order.counterOffer) throw new BadRequestException('No counter-offer to accept.');

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        agreedPrice: order.counterOffer,
        counterOffer: null,
        status: OrderStatus.CONFIRMED,
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: OrderStatus.CONFIRMED,
            note: 'Buyer accepted counter-offer',
          },
        },
      },
    });
  }

  // ─────────────────────────────────────────────
  // AI contract draft
  // ─────────────────────────────────────────────

  async requestContractDraft(orderId: string, requesterId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: { select: { firstName: true, lastName: true } },
        providerProfile: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    if (!order) throw new NotFoundException();
    if (order.buyerId !== requesterId && order.providerProfile.userId !== requesterId) {
      throw new ForbiddenException();
    }

    const categoryMap: Record<string, ContractCategory> = {
      CATERING: 'catering',
      MEAL_PREP_SUBSCRIPTION: 'meal_prep_subscription',
      FARM_SUPPLY: 'farm_supply',
      EVENT_BARTENDING: 'event_bartending',
    };
    const contractCategory = categoryMap[order.providerProfile.category] || 'catering';

    const draft = await this.contractsService.generateContract({
      orderId: order.id,
      buyerName: `${order.buyer.firstName} ${order.buyer.lastName}`,
      providerName: `${order.providerProfile.user.firstName} ${order.providerProfile.user.lastName}`,
      serviceDescription: order.serviceDescription,
      category: contractCategory,
      eventDate: order.eventDate?.toISOString(),
      location: order.location ?? undefined,
      agreedPrice: order.agreedPrice ? Number(order.agreedPrice) : undefined,
      currency: order.currency,
      guestCount: order.guestCount ?? undefined,
      specialRequirements: order.specialRequirements ?? undefined,
    });

    return draft;
  }

  async signContract(orderId: string, requesterId: string, requesterRole: Role) {
    // Reuse the existing state-machine transition logic to mark signatures
    return this.updateStatus(orderId, requesterId, requesterRole, {
      status: OrderStatus.CONTRACT_SIGNED,
    });
  }
}
