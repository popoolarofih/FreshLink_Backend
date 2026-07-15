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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const stripe_provider_1 = require("./providers/stripe.provider");
const client_1 = require("@prisma/client");
let PaymentsService = class PaymentsService {
    constructor(prisma, notifications, stripe) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.stripe = stripe;
    }
    async initiatePayment(buyerId, dto) {
        const order = await this.prisma.order.findUnique({
            where: { id: dto.orderId },
            include: { payment: true, providerProfile: { include: { user: true } } },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found.');
        if (order.buyerId !== buyerId)
            throw new common_1.ForbiddenException();
        if (order.payment)
            throw new common_1.BadRequestException('Payment already initiated.');
        if (order.status !== client_1.OrderStatus.CONFIRMED &&
            order.status !== client_1.OrderStatus.CONTRACT_SIGNED) {
            throw new common_1.BadRequestException('Payment can only be initiated for CONFIRMED or CONTRACT_SIGNED orders.');
        }
        const amount = Number(order.agreedPrice ?? order.initialQuote ?? 0);
        if (amount <= 0) {
            throw new common_1.BadRequestException('Order has no agreed or quoted price.');
        }
        const result = await this.stripe.createPaymentIntent({
            amount: Math.round(amount * 100),
            currency: order.currency ?? 'NGN',
            orderId: order.id,
        });
        const payment = await this.prisma.payment.create({
            data: {
                orderId: order.id,
                amount,
                currency: order.currency ?? 'NGN',
                status: client_1.PaymentStatus.PENDING,
                stripePaymentIntentId: result.providerIntentId,
                provider: 'stripe',
            },
        });
        return { payment, clientSecret: result.clientSecret };
    }
    async markHeld(stripePaymentIntentId) {
        const payment = await this.prisma.payment.findUnique({
            where: { stripePaymentIntentId },
        });
        if (!payment)
            return;
        await this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: client_1.PaymentStatus.HELD, heldAt: new Date() },
        });
    }
    async releaseFunds(orderId, buyerId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { payment: true, providerProfile: { include: { user: true } } },
        });
        if (!order)
            throw new common_1.NotFoundException();
        if (order.buyerId !== buyerId)
            throw new common_1.ForbiddenException();
        if (order.status !== client_1.OrderStatus.DELIVERED) {
            throw new common_1.BadRequestException('Funds can only be released once the order is DELIVERED.');
        }
        const payment = order.payment;
        if (!payment)
            throw new common_1.NotFoundException('No payment record found.');
        if (payment.status !== client_1.PaymentStatus.HELD) {
            throw new common_1.BadRequestException('Payment is not in HELD state.');
        }
        const captureResult = await this.stripe.capturePayment(payment.stripePaymentIntentId);
        const updated = await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: client_1.PaymentStatus.RELEASED,
                stripeChargeId: captureResult.providerChargeId,
                releasedAt: new Date(),
            },
        });
        await this.notifications.send({
            userId: order.providerProfile.user.id,
            type: client_1.NotificationType.PAYMENT_UPDATE,
            title: 'Payment released',
            body: `${order.currency} ${payment.amount} has been released to your account.`,
            data: { orderId },
        });
        return updated;
    }
    async refund(orderId, requesterId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { payment: true },
        });
        if (!order)
            throw new common_1.NotFoundException();
        if (order.buyerId !== requesterId)
            throw new common_1.ForbiddenException();
        const payment = order.payment;
        if (!payment || payment.status !== client_1.PaymentStatus.HELD) {
            throw new common_1.BadRequestException('Refunds can only be issued on HELD payments.');
        }
        const refundResult = await this.stripe.refundPayment(payment.stripeChargeId ?? payment.stripePaymentIntentId);
        const updated = await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: client_1.PaymentStatus.REFUNDED,
                refundedAt: new Date(),
            },
        });
        return { payment: updated, refundId: refundResult.refundId };
    }
    async getPaymentByOrder(orderId, requesterId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { payment: true, providerProfile: true },
        });
        if (!order)
            throw new common_1.NotFoundException();
        const isOwner = order.buyerId === requesterId ||
            order.providerProfile.userId === requesterId;
        if (!isOwner)
            throw new common_1.ForbiddenException();
        return order.payment;
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        stripe_provider_1.StripeProvider])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map