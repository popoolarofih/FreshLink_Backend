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
exports.FavoritesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FavoritesService = class FavoritesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async add(buyerId, providerProfileId) {
        await this.prisma.favorite.upsert({
            where: {
                buyerId_providerProfileId: { buyerId, providerProfileId },
            },
            create: { buyerId, providerProfileId },
            update: {},
        });
        return { message: 'Favorited' };
    }
    async remove(buyerId, providerProfileId) {
        await this.prisma.favorite.deleteMany({
            where: { buyerId, providerProfileId },
        });
        return { message: 'Unfavorited' };
    }
    async listMine(buyerId, page, limit) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.prisma.favorite.findMany({
                where: { buyerId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    providerProfile: {
                        include: {
                            user: {
                                select: { firstName: true, lastName: true, avatarUrl: true },
                            },
                            pricingItems: {
                                orderBy: { basePrice: 'asc' },
                                take: 1,
                            },
                        },
                    },
                },
            }),
            this.prisma.favorite.count({ where: { buyerId } }),
        ]);
        const data = items.map((fav) => {
            const p = fav.providerProfile;
            return {
                providerProfileId: p.id,
                businessName: p.businessName,
                category: p.category,
                city: p.city,
                averageRating: p.averageRating,
                startingPrice: p.pricingItems[0] ? Number(p.pricingItems[0].basePrice) : null,
                favoritedAt: fav.createdAt,
            };
        });
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
};
exports.FavoritesService = FavoritesService;
exports.FavoritesService = FavoritesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FavoritesService);
//# sourceMappingURL=favorites.service.js.map