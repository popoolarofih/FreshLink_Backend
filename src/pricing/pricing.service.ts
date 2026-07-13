import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { GroqClientService } from '../groq-client/groq-client.service';
import {
  PriceSuggestion,
  ServiceContext,
} from '../groq-client/groq-client.types';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);
  private systemPrompt = '';

  constructor(
    private readonly groqClient: GroqClientService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private async loadSystemPrompt(): Promise<string> {
    if (this.systemPrompt) return this.systemPrompt;
    try {
      const filePath = path.join(process.cwd(), 'prompts', 'pricing.prompt.txt');
      this.systemPrompt = await fs.readFile(filePath, 'utf8');
      return this.systemPrompt;
    } catch (err) {
      this.logger.error(`Failed to load pricing prompt: ${err}`);
      return 'Analyze pricing and suggest adjustments based on seasonality.';
    }
  }

  /**
   * Computes median, IQR, and statistical bounds [Q1 - 1.5*IQR, Q3 + 1.5*IQR].
   */
  private calculateStatisticalBaseline(
    category: string,
    prices: number[],
  ): { min: number; max: number; median: number } {
    // Fallback if no comparable prices are provided
    if (!prices || prices.length === 0) {
      let defaultMedian = 100000;
      let defaultIqr = 30000;

      const catLower = category.toLowerCase();
      if (catLower.includes('catering')) {
        defaultMedian = 150000;
        defaultIqr = 50000;
      } else if (catLower.includes('meal_prep') || catLower.includes('subscription')) {
        defaultMedian = 50000;
        defaultIqr = 15000;
      } else if (catLower.includes('farm')) {
        defaultMedian = 80000;
        defaultIqr = 20000;
      } else if (catLower.includes('bartend') || catLower.includes('bar')) {
        defaultMedian = 60000;
        defaultIqr = 15000;
      }

      return {
        min: Math.max(1000, defaultMedian - 1.5 * defaultIqr),
        max: defaultMedian + 1.5 * defaultIqr,
        median: defaultMedian,
      };
    }

    const sorted = [...prices].sort((a, b) => a - b);
    const len = sorted.length;

    // Median
    const mid = Math.floor(len / 2);
    const median = len % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

    // Percentile helper
    const getPercentile = (p: number): number => {
      const idx = (len - 1) * p;
      const base = Math.floor(idx);
      const rest = idx - base;
      if (sorted[base + 1] !== undefined) {
        return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
      }
      return sorted[base];
    };

    const q1 = getPercentile(0.25);
    const q3 = getPercentile(0.75);
    const iqr = q3 - q1 || median * 0.2; // default IQR to 20% of median if IQR is 0

    const minBound = Math.max(1000, median - 1.5 * iqr);
    const maxBound = median + 1.5 * iqr;

    return {
      min: Math.round(minBound),
      max: Math.round(maxBound),
      median: Math.round(median),
    };
  }

  async suggestPrice(context: ServiceContext): Promise<PriceSuggestion> {
    const prices = context.recentComparablePrices || [];
    const stats = this.calculateStatisticalBaseline(context.category, prices);

    // Form cache key based on query context
    const cleanCity = (context.city || 'default').toLowerCase().trim();
    const cleanCategory = context.category.toLowerCase().trim();
    const cleanRating = context.providerRating ?? 0;
    const cleanDate = (context.eventDate || new Date().toISOString().split('T')[0]).slice(0, 10);
    const pricesStr = prices.join('-');

    const cacheKey = `price_suggest:${cleanCategory}:${cleanCity}:${cleanRating}:${cleanDate}:${pricesStr}`;

    try {
      const cached = await this.cacheManager.get<PriceSuggestion>(cacheKey);
      if (cached) {
        this.logger.log(`Pricing suggestion cache hit for key: ${cacheKey}`);
        return cached;
      }
    } catch (err) {
      this.logger.warn(`Failed to read from cache: ${err}`);
    }

    const fallbackResult: PriceSuggestion = {
      suggestedMin: stats.min,
      suggestedMax: stats.max,
      recommended: stats.median,
      currency: 'NGN',
      rationale: 'fallback:statistical-baseline',
      aiFallback: true,
    };

    try {
      const systemPrompt = await this.loadSystemPrompt();
      const userContent = {
        serviceContext: {
          category: context.category,
          city: context.city,
          providerRating: context.providerRating,
          guestCount: context.guestCount,
          durationHours: context.durationHours,
          eventType: context.eventType,
          eventDate: context.eventDate,
        },
        statisticalBaseline: stats,
      };

      const response = await this.groqClient.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(userContent) },
        ],
        {
          model: this.groqClient.reasoningModel, // Use Llama 3.3 70B for pricing rationale quality
          temperature: 0.2,
          jsonMode: true,
        },
      );

      const parsed = JSON.parse(response.content);

      // Clamp Groq's output to +/-30% of the statistical baseline — never trust raw LLM output for money
      const clamp = (val: number, base: number) => {
        const minAllowed = base * 0.7;
        const maxAllowed = base * 1.3;
        return Math.round(Math.min(maxAllowed, Math.max(minAllowed, val)));
      };

      const suggestedMin = clamp(parsed.suggestedMin ?? stats.min, stats.min);
      const suggestedMax = clamp(parsed.suggestedMax ?? stats.max, stats.max);
      const recommended = clamp(parsed.recommended ?? stats.median, stats.median);

      const result: PriceSuggestion = {
        suggestedMin,
        suggestedMax,
        recommended,
        currency: 'NGN',
        rationale: parsed.rationale || 'Suggested based on baseline statistical ranges and seasonal adjustments.',
        aiFallback: false,
      };

      // Write to cache
      try {
        await this.cacheManager.set(cacheKey, result, 3600_000); // cache for 1 hour
      } catch (err) {
        this.logger.warn(`Failed to write pricing result to cache: ${err}`);
      }

      return result;
    } catch (err) {
      this.logger.warn(
        `PricingService fallback kicked in: ${err instanceof Error ? err.message : err}. Flag: ai_fallback=true`,
      );
      return fallbackResult;
    }
  }
}
