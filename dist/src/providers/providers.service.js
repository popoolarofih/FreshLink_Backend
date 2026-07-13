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
exports.ProvidersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProvidersService = class ProvidersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
        const profile = await this.prisma.providerProfile.findUnique({
            where: { userId },
            include: {
                certifications: true,
                portfolioItems: true,
                pricingItems: true,
                availabilitySlots: { where: { isBooked: false }, orderBy: { startTime: 'asc' } },
                dietaryTags: { include: { tag: true } },
                user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
            },
        });
        if (!profile)
            throw new common_1.NotFoundException('Provider profile not found.');
        return profile;
    }
    async getProfileById(id) {
        const profile = await this.prisma.providerProfile.findUnique({
            where: { id },
            include: {
                certifications: true,
                portfolioItems: true,
                pricingItems: true,
                availabilitySlots: { where: { isBooked: false }, orderBy: { startTime: 'asc' } },
                dietaryTags: { include: { tag: true } },
                user: { select: { firstName: true, lastName: true, avatarUrl: true } },
            },
        });
        if (!profile)
            throw new common_1.NotFoundException('Provider profile not found.');
        return profile;
    }
    async updateProfile(userId, dto) {
        const profile = await this.prisma.providerProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Provider profile not found.');
        const { tags, ...rest } = dto;
        if (tags && tags.length >= 0) {
            await this.prisma.providerTag.deleteMany({ where: { providerProfileId: profile.id } });
            if (tags.length > 0) {
                const tagRecords = await Promise.all(tags.map((name) => this.prisma.tag.upsert({
                    where: { name },
                    create: { name },
                    update: {},
                })));
                await this.prisma.providerTag.createMany({
                    data: tagRecords.map((t) => ({ providerProfileId: profile.id, tagId: t.id })),
                    skipDuplicates: true,
                });
            }
        }
        const updated = await this.prisma.providerProfile.update({
            where: { userId },
            data: rest,
        });
        const score = await this.computeCompletenessScore(updated.id);
        return this.prisma.providerProfile.update({
            where: { id: updated.id },
            data: { completenessScore: score },
            include: { dietaryTags: { include: { tag: true } } },
        });
    }
    async computeCompletenessScore(profileId) {
        const p = await this.prisma.providerProfile.findUnique({
            where: { id: profileId },
            include: {
                certifications: true,
                portfolioItems: true,
                pricingItems: true,
                availabilitySlots: true,
                dietaryTags: true,
                user: { select: { avatarUrl: true, phone: true } },
            },
        });
        if (!p)
            return 0;
        const checks = [
            !!p.category,
            !!p.bio && p.bio.length > 20,
            !!p.businessName,
            !!p.city,
            !!p.user?.avatarUrl,
            !!p.user?.phone,
            p.portfolioItems.length > 0,
            p.pricingItems.length > 0,
            p.certifications.length > 0,
            p.availabilitySlots.length > 0,
            p.dietaryTags.length > 0,
        ];
        const passed = checks.filter(Boolean).length;
        return Math.round((passed / checks.length) * 100);
    }
    async addPortfolioItem(userId, dto) {
        const profile = await this.getProfile(userId);
        return this.prisma.portfolioItem.create({
            data: { ...dto, providerProfileId: profile.id },
        });
    }
    async removePortfolioItem(userId, itemId) {
        const profile = await this.getProfile(userId);
        const item = await this.prisma.portfolioItem.findUnique({ where: { id: itemId } });
        if (!item || item.providerProfileId !== profile.id) {
            throw new common_1.ForbiddenException('Item not found or does not belong to you.');
        }
        return this.prisma.portfolioItem.delete({ where: { id: itemId } });
    }
    async addPricingItem(userId, dto) {
        const profile = await this.getProfile(userId);
        return this.prisma.pricingItem.create({
            data: { ...dto, providerProfileId: profile.id },
        });
    }
    async removePricingItem(userId, itemId) {
        const profile = await this.getProfile(userId);
        const item = await this.prisma.pricingItem.findUnique({ where: { id: itemId } });
        if (!item || item.providerProfileId !== profile.id) {
            throw new common_1.ForbiddenException('Item not found or does not belong to you.');
        }
        return this.prisma.pricingItem.delete({ where: { id: itemId } });
    }
    async addAvailabilitySlot(userId, dto) {
        const profile = await this.getProfile(userId);
        return this.prisma.availabilitySlot.create({
            data: {
                providerProfileId: profile.id,
                startTime: dto.startTime,
                endTime: dto.endTime,
            },
        });
    }
    async removeAvailabilitySlot(userId, slotId) {
        const profile = await this.getProfile(userId);
        const slot = await this.prisma.availabilitySlot.findUnique({ where: { id: slotId } });
        if (!slot || slot.providerProfileId !== profile.id) {
            throw new common_1.ForbiddenException('Slot not found or does not belong to you.');
        }
        return this.prisma.availabilitySlot.delete({ where: { id: slotId } });
    }
};
exports.ProvidersService = ProvidersService;
exports.ProvidersService = ProvidersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProvidersService);
//# sourceMappingURL=providers.service.js.map