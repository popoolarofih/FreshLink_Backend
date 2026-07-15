import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    createReview(user: any, dto: CreateReviewDto): Promise<{
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
    getProviderReviews(id: string, page?: number, limit?: number): Promise<{
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
}
