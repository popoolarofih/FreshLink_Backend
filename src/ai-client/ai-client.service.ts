import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  BuyerContext,
  CandidateProvider,
  ContractDraft,
  OrderContext,
  PriceSuggestion,
  RankedProvider,
  SearchFilters,
  ServiceContext,
} from './ai-client.types';

/**
 * AiServiceClient
 *
 * Injectable HTTP client wrapping calls to the internal AI microservice.
 * All methods degrade gracefully — if the AI service is unreachable or returns
 * an error, rule-based fallbacks are returned so the main flow is never blocked.
 *
 * Auth: shared internal API key sent as the `x-api-key` header.
 */
@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);
  private readonly http: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    const baseURL = config.get<string>('AI_SERVICE_URL', 'http://localhost:4000');
    const apiKey = config.get<string>('AI_SERVICE_API_KEY', '');
    const timeout = config.get<number>('AI_SERVICE_TIMEOUT_MS', 5000);

    this.http = axios.create({
      baseURL,
      timeout,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // rankProviders
  // Returns AI-ranked list; falls back to rating-desc sort on failure.
  // ──────────────────────────────────────────────────────────────────────────

  async rankProviders(
    buyerContext: BuyerContext,
    candidateProviders: CandidateProvider[],
  ): Promise<RankedProvider[]> {
    try {
      const { data } = await this.http.post<RankedProvider[]>('/rank-providers', {
        buyerContext,
        candidateProviders,
      });
      return data;
    } catch (err) {
      this.logger.warn(`rankProviders fallback: ${(err as Error).message}`);
      // Fallback: sort by averageRating descending
      return candidateProviders
        .sort((a, b) => b.averageRating - a.averageRating)
        .map((p) => ({ ...p, score: p.averageRating, reasoning: 'fallback:rating-sort' }));
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // suggestPrice
  // Falls back to a simple category-based estimate on failure.
  // ──────────────────────────────────────────────────────────────────────────

  async suggestPrice(serviceContext: ServiceContext): Promise<PriceSuggestion> {
    try {
      const { data } = await this.http.post<PriceSuggestion>('/suggest-price', serviceContext);
      return data;
    } catch (err) {
      this.logger.warn(`suggestPrice fallback: ${(err as Error).message}`);
      return {
        suggestedMin: 50000,
        suggestedMax: 500000,
        currency: 'NGN',
        reasoning: 'fallback:static-range',
      };
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // generateContract
  // Falls back to a minimal plaintext template on failure.
  // ──────────────────────────────────────────────────────────────────────────

  async generateContract(orderContext: OrderContext): Promise<ContractDraft> {
    try {
      const { data } = await this.http.post<ContractDraft>('/generate-contract', orderContext);
      return data;
    } catch (err) {
      this.logger.warn(`generateContract fallback: ${(err as Error).message}`);
      return {
        title: `Service Agreement – Order ${orderContext.orderId}`,
        body: [
          `This agreement is between ${orderContext.buyerName} (Buyer) and`,
          `${orderContext.providerName} (Provider) for the following service:`,
          `"${orderContext.serviceDescription}".`,
          orderContext.eventDate ? `Event Date: ${orderContext.eventDate}` : '',
          orderContext.agreedPrice
            ? `Agreed Price: ${orderContext.agreedPrice} ${orderContext.currency ?? 'NGN'}`
            : '',
          `\n[Auto-generated fallback template – please review and sign.]`,
        ]
          .filter(Boolean)
          .join('\n'),
        generatedAt: new Date().toISOString(),
      };
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // parseSearchQuery
  // Converts a natural-language query into structured SearchFilters.
  // Falls back to an empty filter object on failure.
  // ──────────────────────────────────────────────────────────────────────────

  async parseSearchQuery(rawQuery: string): Promise<SearchFilters> {
    try {
      const { data } = await this.http.post<SearchFilters>('/parse-search', { rawQuery });
      return data;
    } catch (err) {
      this.logger.warn(`parseSearchQuery fallback: ${(err as Error).message}`);
      return {}; // empty → treat as no filters, return all results
    }
  }
}
