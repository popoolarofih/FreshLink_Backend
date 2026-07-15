import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BuyersService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(userId: string, range: string) {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '90d':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '12m':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case '30d':
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        break;
    }

    const orders = await this.prisma.order.findMany({
      where: {
        buyerId: userId,
        createdAt: { gte: startDate },
      },
      include: {
        payment: true,
        providerProfile: { select: { category: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Spend: sum of RELEASED payments grouped by date
    const spendMap = new Map<string, number>();
    let totalSpend = 0;

    for (const order of orders) {
      if (order.payment?.status === 'RELEASED') {
        const dateStr = order.createdAt.toISOString().slice(0, 10);
        const amount = Number(order.payment.amount);
        spendMap.set(dateStr, (spendMap.get(dateStr) || 0) + amount);
        totalSpend += amount;
      }
    }

    const spend = Array.from(spendMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Orders by category
    const categoryMap = new Map<string, number>();
    for (const order of orders) {
      const cat = order.providerProfile?.category || 'UNKNOWN';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    }

    const ordersByCategory = Array.from(categoryMap.entries()).map(
      ([category, count]) => ({ category, count }),
    );

    return {
      spend,
      ordersByCategory,
      totalSpend,
      totalOrders: orders.length,
    };
  }

  async getReorderHistory(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { buyerId: userId },
      include: {
        providerProfile: {
          select: {
            id: true,
            businessName: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Dedupe by provider
    const providerMap = new Map<
      string,
      {
        providerProfileId: string;
        providerName: string;
        category: string;
        lastOrderedAt: Date;
        orderCount: number;
      }
    >();

    for (const order of orders) {
      const pid = order.providerProfileId;
      const existing = providerMap.get(pid);
      if (existing) {
        existing.orderCount++;
      } else {
        providerMap.set(pid, {
          providerProfileId: pid,
          providerName:
            order.providerProfile.businessName || 'Unknown Provider',
          category: order.providerProfile.category,
          lastOrderedAt: order.createdAt,
          orderCount: 1,
        });
      }
    }

    return Array.from(providerMap.values())
      .sort(
        (a, b) =>
          b.lastOrderedAt.getTime() - a.lastOrderedAt.getTime(),
      )
      .slice(0, 10);
  }
}
