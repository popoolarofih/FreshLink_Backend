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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const search_parsing_service_1 = require("./search-parsing/search-parsing.service");
const matchmaking_service_1 = require("./matchmaking/matchmaking.service");
let SearchService = class SearchService {
    constructor(prisma, searchParsing, matchmaking) {
        this.prisma = prisma;
        this.searchParsing = searchParsing;
        this.matchmaking = matchmaking;
    }
    async searchProviders(dto, buyerId) {
        let aiFilters = {};
        if (dto.q) {
            aiFilters = await this.searchParsing.parseQuery(dto.q);
        }
        const mergedFilters = {
            category: dto.category ?? aiFilters.category,
            city: dto.city ?? aiFilters.location,
            minPrice: dto.minPrice,
            maxPrice: dto.maxPrice ?? aiFilters.maxPrice,
            tags: dto.tags ?? [
                ...(aiFilters.dietaryTags || []),
                ...(aiFilters.cuisineTags || []),
            ],
            minRating: dto.rating,
            availableFrom: dto.availableFrom ?? aiFilters.dateFrom,
            availableTo: dto.availableTo ?? aiFilters.dateTo,
        };
        const where = {
            isAvailable: true,
            user: { isActive: true },
        };
        if (mergedFilters.category)
            where.category = mergedFilters.category;
        if (mergedFilters.city) {
            where.city = { contains: mergedFilters.city, mode: 'insensitive' };
        }
        if (mergedFilters.minRating) {
            where.averageRating = { gte: mergedFilters.minRating };
        }
        if (mergedFilters.minPrice !== undefined ||
            mergedFilters.maxPrice !== undefined) {
            where.pricingItems = {
                some: {
                    basePrice: {
                        ...(mergedFilters.minPrice !== undefined && {
                            gte: mergedFilters.minPrice,
                        }),
                        ...(mergedFilters.maxPrice !== undefined && {
                            lte: mergedFilters.maxPrice,
                        }),
                    },
                },
            };
        }
        if (mergedFilters.tags && mergedFilters.tags.length > 0) {
            where.dietaryTags = {
                some: { tag: { name: { in: mergedFilters.tags } } },
            };
        }
        if (mergedFilters.availableFrom || mergedFilters.availableTo) {
            where.availabilitySlots = {
                some: {
                    isBooked: false,
                    ...(mergedFilters.availableFrom && {
                        startTime: { lte: new Date(mergedFilters.availableFrom) },
                    }),
                    ...(mergedFilters.availableTo && {
                        endTime: { gte: new Date(mergedFilters.availableTo) },
                    }),
                },
            };
        }
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const skip = (page - 1) * limit;
        const [providers, total] = await Promise.all([
            this.prisma.providerProfile.findMany({
                where,
                skip,
                take: limit,
                orderBy: dto.sortBy === 'price'
                    ? { pricingItems: { _count: 'asc' } }
                    : { averageRating: 'desc' },
                include: {
                    pricingItems: true,
                    dietaryTags: { include: { tag: true } },
                    portfolioItems: { take: 3 },
                    user: {
                        select: { firstName: true, lastName: true, avatarUrl: true },
                    },
                },
            }),
            this.prisma.providerProfile.count({ where }),
        ]);
        let ranked = providers;
        if (dto.sortBy === 'ai' || !dto.sortBy) {
            const candidates = providers.map((p) => ({
                id: p.id,
                name: `${p.user.firstName} ${p.user.lastName}`,
                category: p.category,
                averageRating: p.averageRating,
                city: p.city ?? undefined,
                basePrice: p.pricingItems[0]
                    ? Number(p.pricingItems[0].basePrice)
                    : undefined,
                tags: p.dietaryTags.map((t) => t.tag.name),
                isAvailable: p.isAvailable,
            }));
            const rankedResult = await this.matchmaking.rankProviders({
                buyerId: buyerId ?? 'anonymous',
                location: dto.city,
                budget: dto.maxPrice,
            }, candidates);
            const scoreMap = new Map(rankedResult.map((r) => [r.id, r.score]));
            ranked = [...providers].sort((a, b) => (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0));
        }
        return {
            data: ranked,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        search_parsing_service_1.SearchParsingService,
        matchmaking_service_1.MatchmakingService])
], SearchService);
//# sourceMappingURL=search.service.js.map