import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { AddPortfolioItemDto } from './dto/add-portfolio-item.dto';
import { AddPricingItemDto } from './dto/add-pricing-item.dto';
import { AddAvailabilitySlotDto } from './dto/add-availability-slot.dto';
import { PricingService } from '../pricing/pricing.service';

@Injectable()
export class ProvidersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  async getPriceSuggestion(
    userId: string,
    category: string,
    guestCount?: number,
    durationHours?: number,
    eventType?: string,
  ) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      include: { pricingItems: true },
    });
    if (!profile) throw new NotFoundException('Provider profile not found.');

    const recentComparablePrices =
      profile.pricingItems.map((item) => Number(item.basePrice)) || [];

    return this.pricingService.suggestPrice({
      category,
      city: profile.city || undefined,
      providerRating: profile.averageRating || undefined,
      guestCount,
      durationHours,
      eventType,
      recentComparablePrices,
    });
  }

  // ─────────────────────────────────────────────
  // Profile
  // ─────────────────────────────────────────────

  async getProfile(userId: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        certifications: true,
        portfolioItems: true,
        pricingItems: true,
        availabilitySlots: {
          where: { isBooked: false },
          orderBy: { startTime: 'asc' },
        },
        dietaryTags: { include: { tag: true } },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
    if (!profile) throw new NotFoundException('Provider profile not found.');
    return profile;
  }

  async getProfileById(id: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { id },
      include: {
        certifications: true,
        portfolioItems: true,
        pricingItems: true,
        availabilitySlots: {
          where: { isBooked: false },
          orderBy: { startTime: 'asc' },
        },
        dietaryTags: { include: { tag: true } },
        user: { select: { firstName: true, lastName: true, avatarUrl: true } },
      },
    });
    if (!profile) throw new NotFoundException('Provider profile not found.');
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProviderProfileDto) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Provider profile not found.');

    const { tags, ...rest } = dto;

    // Handle tags: upsert each tag, then sync the join table
    if (tags && tags.length >= 0) {
      // Delete existing tag relations
      await this.prisma.providerTag.deleteMany({
        where: { providerProfileId: profile.id },
      });

      if (tags.length > 0) {
        const tagRecords = await Promise.all(
          tags.map((name) =>
            this.prisma.tag.upsert({
              where: { name },
              create: { name },
              update: {},
            }),
          ),
        );
        await this.prisma.providerTag.createMany({
          data: tagRecords.map((t) => ({
            providerProfileId: profile.id,
            tagId: t.id,
          })),
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

  // ─────────────────────────────────────────────
  // Completeness score (simple field-coverage %)
  // ─────────────────────────────────────────────

  private async computeCompletenessScore(profileId: string): Promise<number> {
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
    if (!p) return 0;

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

  // ─────────────────────────────────────────────
  // Portfolio
  // ─────────────────────────────────────────────

  async addPortfolioItem(userId: string, dto: AddPortfolioItemDto) {
    const profile = await this.getProfile(userId);
    return this.prisma.portfolioItem.create({
      data: { ...dto, providerProfileId: profile.id },
    });
  }

  async removePortfolioItem(userId: string, itemId: string) {
    const profile = await this.getProfile(userId);
    const item = await this.prisma.portfolioItem.findUnique({
      where: { id: itemId },
    });
    if (!item || item.providerProfileId !== profile.id) {
      throw new ForbiddenException('Item not found or does not belong to you.');
    }
    return this.prisma.portfolioItem.delete({ where: { id: itemId } });
  }

  // ─────────────────────────────────────────────
  // Pricing
  // ─────────────────────────────────────────────

  async addPricingItem(userId: string, dto: AddPricingItemDto) {
    const profile = await this.getProfile(userId);
    return this.prisma.pricingItem.create({
      data: { ...dto, providerProfileId: profile.id },
    });
  }

  async removePricingItem(userId: string, itemId: string) {
    const profile = await this.getProfile(userId);
    const item = await this.prisma.pricingItem.findUnique({
      where: { id: itemId },
    });
    if (!item || item.providerProfileId !== profile.id) {
      throw new ForbiddenException('Item not found or does not belong to you.');
    }
    return this.prisma.pricingItem.delete({ where: { id: itemId } });
  }

  // ─────────────────────────────────────────────
  // Availability
  // ─────────────────────────────────────────────

  async addAvailabilitySlot(userId: string, dto: AddAvailabilitySlotDto) {
    const profile = await this.getProfile(userId);
    return this.prisma.availabilitySlot.create({
      data: {
        providerProfileId: profile.id,
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
    });
  }

  async removeAvailabilitySlot(userId: string, slotId: string) {
    const profile = await this.getProfile(userId);
    const slot = await this.prisma.availabilitySlot.findUnique({
      where: { id: slotId },
    });
    if (!slot || slot.providerProfileId !== profile.id) {
      throw new ForbiddenException('Slot not found or does not belong to you.');
    }
    return this.prisma.availabilitySlot.delete({ where: { id: slotId } });
  }
}
