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
exports.BuyersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BuyersService = class BuyersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAnalytics(userId, range) {
        const now = new Date();
        let startDate;
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
        const spendMap = new Map();
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
        const categoryMap = new Map();
        for (const order of orders) {
            const cat = order.providerProfile?.category || 'UNKNOWN';
            categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
        }
        const ordersByCategory = Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count }));
        return {
            spend,
            ordersByCategory,
            totalSpend,
            totalOrders: orders.length,
        };
    }
    async getReorderHistory(userId) {
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
        const providerMap = new Map();
        for (const order of orders) {
            const pid = order.providerProfileId;
            const existing = providerMap.get(pid);
            if (existing) {
                existing.orderCount++;
            }
            else {
                providerMap.set(pid, {
                    providerProfileId: pid,
                    providerName: order.providerProfile.businessName || 'Unknown Provider',
                    category: order.providerProfile.category,
                    lastOrderedAt: order.createdAt,
                    orderCount: 1,
                });
            }
        }
        return Array.from(providerMap.values())
            .sort((a, b) => b.lastOrderedAt.getTime() - a.lastOrderedAt.getTime())
            .slice(0, 10);
    }
};
exports.BuyersService = BuyersService;
exports.BuyersService = BuyersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BuyersService);
//# sourceMappingURL=buyers.service.js.map