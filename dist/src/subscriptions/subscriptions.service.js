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
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const client_1 = require("@prisma/client");
const PLAN_DURATION_DAYS = {
    [client_1.SubscriptionPlan.BASIC]: 30,
    [client_1.SubscriptionPlan.PREMIUM]: 30,
    [client_1.SubscriptionPlan.BUSINESS]: 30,
};
let SubscriptionsService = class SubscriptionsService {
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async createOrUpgrade(userId, dto) {
        const existing = await this.prisma.subscription.findUnique({ where: { userId } });
        const durationDays = PLAN_DURATION_DAYS[dto.plan];
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + durationDays);
        if (existing) {
            return this.prisma.subscription.update({
                where: { userId },
                data: {
                    plan: dto.plan,
                    status: client_1.SubscriptionStatus.ACTIVE,
                    startedAt: now,
                    expiresAt,
                    cancelledAt: null,
                },
            });
        }
        return this.prisma.subscription.create({
            data: {
                userId,
                plan: dto.plan,
                status: client_1.SubscriptionStatus.ACTIVE,
                startedAt: now,
                expiresAt,
            },
        });
    }
    async getMySubscription(userId) {
        const sub = await this.prisma.subscription.findUnique({ where: { userId } });
        if (!sub)
            throw new common_1.NotFoundException('No subscription found.');
        return sub;
    }
    async cancel(userId) {
        const sub = await this.prisma.subscription.findUnique({ where: { userId } });
        if (!sub)
            throw new common_1.NotFoundException('No subscription found.');
        if (sub.status === client_1.SubscriptionStatus.CANCELLED) {
            throw new common_1.BadRequestException('Subscription already cancelled.');
        }
        return this.prisma.subscription.update({
            where: { userId },
            data: { status: client_1.SubscriptionStatus.CANCELLED, cancelledAt: new Date() },
        });
    }
    async processRenewals() {
        const now = new Date();
        const expired = await this.prisma.subscription.findMany({
            where: {
                status: client_1.SubscriptionStatus.ACTIVE,
                expiresAt: { lte: now },
            },
        });
        for (const sub of expired) {
            await this.prisma.subscription.update({
                where: { id: sub.id },
                data: { status: client_1.SubscriptionStatus.EXPIRED },
            });
            await this.notifications.send({
                userId: sub.userId,
                type: client_1.NotificationType.SUBSCRIPTION_EXPIRED,
                title: 'Subscription expired',
                body: `Your ${sub.plan} plan has expired. Renew to keep access.`,
                data: { subscriptionId: sub.id },
            });
        }
        return { processed: expired.length };
    }
    async processUpcomingRenewalReminders() {
        const now = new Date();
        const threeDaysFromNow = new Date(now);
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        const upcoming = await this.prisma.subscription.findMany({
            where: {
                status: client_1.SubscriptionStatus.ACTIVE,
                expiresAt: { gte: now, lte: threeDaysFromNow },
            },
        });
        for (const sub of upcoming) {
            await this.notifications.send({
                userId: sub.userId,
                type: client_1.NotificationType.SUBSCRIPTION_RENEWAL,
                title: 'Subscription expiring soon',
                body: `Your ${sub.plan} plan expires on ${sub.expiresAt.toLocaleDateString()}. Renew now to avoid interruption.`,
                data: { subscriptionId: sub.id },
            });
        }
        return { reminded: upcoming.length };
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map