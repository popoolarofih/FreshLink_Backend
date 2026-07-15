import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async add(buyerId: string, providerProfileId: string) {
    await this.prisma.favorite.upsert({
      where: {
        buyerId_providerProfileId: { buyerId, providerProfileId },
      },
      create: { buyerId, providerProfileId },
      update: {},
    });
    return { message: 'Favorited' };
  }

  async remove(buyerId: string, providerProfileId: string) {
    await this.prisma.favorite.deleteMany({
      where: { buyerId, providerProfileId },
    });
    return { message: 'Unfavorited' };
  }

  async listMine(
    buyerId: string,
    page: number,
    limit: number,
  ) {
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
}
