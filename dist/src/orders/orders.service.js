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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const contracts_service_1 = require("./contracts/contracts.service");
const orders_constants_1 = require("./orders.constants");
const client_1 = require("@prisma/client");
let OrdersService = class OrdersService {
    constructor(prisma, notifications, contractsService, ordersQueue) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.contractsService = contractsService;
        this.ordersQueue = ordersQueue;
    }
    async createOrder(buyerId, dto) {
        const provider = await this.prisma.providerProfile.findUnique({
            where: { id: dto.providerProfileId },
            include: { user: { select: { id: true, firstName: true } } },
        });
        if (!provider)
            throw new common_1.NotFoundException('Provider not found.');
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
                status: isInstantBooking ? client_1.OrderStatus.CONFIRMED : client_1.OrderStatus.REQUESTED,
                statusHistory: {
                    create: {
                        toStatus: isInstantBooking ? client_1.OrderStatus.CONFIRMED : client_1.OrderStatus.REQUESTED,
                        note: isInstantBooking ? 'Instant booking' : 'Order requested',
                    },
                },
            },
        });
        await this.notifications.send({
            userId: provider.user.id,
            type: client_1.NotificationType.ORDER_STATUS_CHANGE,
            title: 'New booking request',
            body: `You have a new ${isInstantBooking ? 'instant booking' : 'quote request'} for: ${dto.serviceDescription}`,
            data: { orderId: order.id },
        });
        return order;
    }
    async getOrderById(orderId, requesterId, requesterRole) {
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
        if (!order)
            throw new common_1.NotFoundException('Order not found.');
        const isOwner = order.buyerId === requesterId ||
            order.providerProfile.userId === requesterId ||
            requesterRole === client_1.Role.ADMIN;
        if (!isOwner)
            throw new common_1.ForbiddenException();
        return order;
    }
    async getBuyerOrders(buyerId, page = 1, limit = 20) {
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
    async getProviderOrders(userId, page = 1, limit = 20) {
        const profile = await this.prisma.providerProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Provider profile not found.');
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
    async updateStatus(orderId, requesterId, requesterRole, dto) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                providerProfile: { include: { user: true } },
                buyer: { select: { id: true, email: true, firstName: true } },
            },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found.');
        const isProvider = order.providerProfile.userId === requesterId;
        const isBuyer = order.buyerId === requesterId;
        const isAdmin = requesterRole === client_1.Role.ADMIN;
        if (!isProvider && !isBuyer && !isAdmin)
            throw new common_1.ForbiddenException();
        const allowed = orders_constants_1.ORDER_TRANSITIONS[order.status];
        if (!allowed.includes(dto.status)) {
            throw new common_1.BadRequestException(`Transition from ${order.status} → ${dto.status} is not allowed. ` +
                `Valid next states: [${allowed.join(', ')}]`);
        }
        const updated = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: dto.status,
                ...(dto.status === client_1.OrderStatus.CONTRACT_SIGNED && { contractSignedAt: new Date() }),
                statusHistory: {
                    create: {
                        fromStatus: order.status,
                        toStatus: dto.status,
                        note: dto.note,
                    },
                },
            },
        });
        const notifyUserId = isProvider ? order.buyerId : order.providerProfile.userId;
        await this.notifications.send({
            userId: notifyUserId,
            type: client_1.NotificationType.ORDER_STATUS_CHANGE,
            title: 'Order status updated',
            body: `Order status changed to ${dto.status}.`,
            data: { orderId },
        });
        await this.ordersQueue.add('status-changed', { orderId, newStatus: dto.status });
        return updated;
    }
    async submitCounterOffer(orderId, providerId, dto) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { providerProfile: true },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found.');
        if (order.providerProfile.userId !== providerId)
            throw new common_1.ForbiddenException();
        if (order.status !== client_1.OrderStatus.REQUESTED) {
            throw new common_1.BadRequestException('Counter-offers can only be made on REQUESTED orders.');
        }
        const updated = await this.prisma.order.update({
            where: { id: orderId },
            data: { counterOffer: dto.amount },
        });
        await this.notifications.send({
            userId: order.buyerId,
            type: client_1.NotificationType.ORDER_STATUS_CHANGE,
            title: 'Counter-offer received',
            body: `The provider has made a counter-offer of ${dto.amount} ${order.currency}.`,
            data: { orderId },
        });
        return updated;
    }
    async acceptCounterOffer(orderId, buyerId) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order)
            throw new common_1.NotFoundException();
        if (order.buyerId !== buyerId)
            throw new common_1.ForbiddenException();
        if (!order.counterOffer)
            throw new common_1.BadRequestException('No counter-offer to accept.');
        return this.prisma.order.update({
            where: { id: orderId },
            data: {
                agreedPrice: order.counterOffer,
                counterOffer: null,
                status: client_1.OrderStatus.CONFIRMED,
                statusHistory: {
                    create: {
                        fromStatus: order.status,
                        toStatus: client_1.OrderStatus.CONFIRMED,
                        note: 'Buyer accepted counter-offer',
                    },
                },
            },
        });
    }
    async requestContractDraft(orderId, requesterId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                buyer: { select: { firstName: true, lastName: true } },
                providerProfile: {
                    include: { user: { select: { firstName: true, lastName: true } } },
                },
            },
        });
        if (!order)
            throw new common_1.NotFoundException();
        if (order.buyerId !== requesterId && order.providerProfile.userId !== requesterId) {
            throw new common_1.ForbiddenException();
        }
        const categoryMap = {
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
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, bull_1.InjectQueue)(orders_constants_1.ORDERS_QUEUE)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        contracts_service_1.ContractsService, Object])
], OrdersService);
//# sourceMappingURL=orders.service.js.map