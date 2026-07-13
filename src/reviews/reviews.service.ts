import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { NotificationType, OrderStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async createReview(authorId: string, dto: CreateReviewDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        review: true,
        providerProfile: { include: { user: { select: { id: true } } } },
      },
    });

    if (!order) throw new NotFoundException('Order not found.');
    if (order.buyerId !== authorId) {
      throw new ForbiddenException('Only the buyer can review an order.');
    }
    if (order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.REVIEWED) {
      throw new BadRequestException('Order must be DELIVERED before a review can be left.');
    }
    if (order.review) {
      throw new BadRequestException('A review already exists for this order.');
    }

    // Create review
    const review = await this.prisma.review.create({
      data: {
        orderId: dto.orderId,
        authorId,
        providerProfileId: order.providerProfileId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    // Advance order status to REVIEWED
    await this.prisma.order.update({
      where: { id: dto.orderId },
      data: {
        status: OrderStatus.REVIEWED,
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: OrderStatus.REVIEWED,
            note: 'Buyer left a review',
          },
        },
      },
    });

    // Recalculate provider's aggregate rating (denormalized, fast search sort)
    await this.recalculateProviderRating(order.providerProfileId);

    // Notify provider
    await this.notifications.send({
      userId: order.providerProfile.user.id,
      type: NotificationType.REVIEW_RECEIVED,
      title: 'New review received',
      body: `You received a ${dto.rating}-star review.`,
      data: { orderId: dto.orderId, reviewId: review.id },
    });

    return review;
  }

  async getProviderReviews(providerProfileId: string, page = 1, limit = 20) {
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

  // ─────────────────────────────────────────────
  // Recalculate & denormalize average rating
  // Called on every review write for fast search sorting
  // ─────────────────────────────────────────────

  private async recalculateProviderRating(providerProfileId: string) {
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
}
