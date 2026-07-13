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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const client_1 = require("@prisma/client");
let ReviewsService = class ReviewsService {
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async createReview(authorId, dto) {
        const order = await this.prisma.order.findUnique({
            where: { id: dto.orderId },
            include: {
                review: true,
                providerProfile: { include: { user: { select: { id: true } } } },
            },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found.');
        if (order.buyerId !== authorId) {
            throw new common_1.ForbiddenException('Only the buyer can review an order.');
        }
        if (order.status !== client_1.OrderStatus.DELIVERED && order.status !== client_1.OrderStatus.REVIEWED) {
            throw new common_1.BadRequestException('Order must be DELIVERED before a review can be left.');
        }
        if (order.review) {
            throw new common_1.BadRequestException('A review already exists for this order.');
        }
        const review = await this.prisma.review.create({
            data: {
                orderId: dto.orderId,
                authorId,
                providerProfileId: order.providerProfileId,
                rating: dto.rating,
                comment: dto.comment,
            },
        });
        await this.prisma.order.update({
            where: { id: dto.orderId },
            data: {
                status: client_1.OrderStatus.REVIEWED,
                statusHistory: {
                    create: {
                        fromStatus: order.status,
                        toStatus: client_1.OrderStatus.REVIEWED,
                        note: 'Buyer left a review',
                    },
                },
            },
        });
        await this.recalculateProviderRating(order.providerProfileId);
        await this.notifications.send({
            userId: order.providerProfile.user.id,
            type: client_1.NotificationType.REVIEW_RECEIVED,
            title: 'New review received',
            body: `You received a ${dto.rating}-star review.`,
            data: { orderId: dto.orderId, reviewId: review.id },
        });
        return review;
    }
    async getProviderReviews(providerProfileId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where: { providerProfileId, isPublished: true },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: { select: { firstName: true, lastName: true, avatarUrl: true } },
                },
            }),
            this.prisma.review.count({ where: { providerProfileId, isPublished: true } }),
        ]);
        return { data: reviews, total, page, limit };
    }
    async recalculateProviderRating(providerProfileId) {
        const result = await this.prisma.review.aggregate({
            where: { providerProfileId, isPublished: true },
            _avg: { rating: true },
            _count: { rating: true },
        });
        await this.prisma.providerProfile.update({
            where: { id: providerProfileId },
            data: {
                averageRating: result._avg.rating ?? 0,
                totalReviews: result._count.rating,
            },
        });
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map