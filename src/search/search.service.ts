import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchParsingService } from './search-parsing/search-parsing.service';
import { MatchmakingService } from './matchmaking/matchmaking.service';
import { SearchProvidersDto } from './dto/search-providers.dto';
import {
  ParsedSearchFilters,
  CandidateProvider,
} from '../groq-client/groq-client.types';
import { Prisma } from '@prisma/client';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchParsing: SearchParsingService,
    private readonly matchmaking: MatchmakingService,
  ) {}

  async searchProviders(dto: SearchProvidersDto, buyerId?: string) {
    // ── Step 1: build filter params ──────────────────────────────────────────
    // If a natural-language query is present, run it through the AI parser.
    // Explicit DTO fields override AI-parsed values (caller intent wins).
    let aiFilters: Partial<ParsedSearchFilters> = {};
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

    // ── Step 2: build Prisma where clause ────────────────────────────────────
    const where: Prisma.ProviderProfileWhereInput = {
      isAvailable: true,
      user: { isActive: true },
    };

    if (mergedFilters.category) where.category = mergedFilters.category as any;
    if (mergedFilters.city) {
      where.city = { contains: mergedFilters.city, mode: 'insensitive' };
    }
    if (mergedFilters.minRating) {
      where.averageRating = { gte: mergedFilters.minRating };
    }

    // Price filter: match providers that have at least one pricing item in range
    if (
      mergedFilters.minPrice !== undefined ||
      mergedFilters.maxPrice !== undefined
    ) {
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

    // Tag filter
    if (mergedFilters.tags && mergedFilters.tags.length > 0) {
      where.dietaryTags = {
        some: { tag: { name: { in: mergedFilters.tags } } },
      };
    }

    // Availability filter
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

    // ── Step 3: query DB ─────────────────────────────────────────────────────
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const [providers, total] = await Promise.all([
      this.prisma.providerProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy:
          dto.sortBy === 'price'
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

    // ── Step 4: optional AI ranking ──────────────────────────────────────────
    let ranked = providers;
    if (dto.sortBy === 'ai' || !dto.sortBy) {
      const candidates: CandidateProvider[] = providers.map((p) => ({
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

      const rankedResult = await this.matchmaking.rankProviders(
        {
          buyerId: buyerId ?? 'anonymous',
          location: dto.city,
          budget: dto.maxPrice,
        },
        candidates,
      );

      // Re-sort providers array according to AI score order
      const scoreMap = new Map(rankedResult.map((r) => [r.id, r.score]));
      ranked = [...providers].sort(
        (a, b) => (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0),
      );
    }

    return {
      data: ranked,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
