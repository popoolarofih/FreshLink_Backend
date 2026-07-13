import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReviewDto } from './dto/create-review.dto';
export declare class ReviewsService {
    private readonly prisma;
    private readonly notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    createReview(authorId: string, dto: CreateReviewDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        providerProfileId: string;
        rating: number;
        orderId: string;
        authorId: string;
        comment: string | null;
        isPublished: boolean;
    }>;
    getProviderReviews(providerProfileId: string, page?: number, limit?: number): Promise<{
        data: ({
            author: {
                firstName: string;
                lastName: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            providerProfileId: string;
            rating: number;
            orderId: string;
            authorId: string;
            comment: string | null;
            isPublished: boolean;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    private recalculateProviderRating;
}
