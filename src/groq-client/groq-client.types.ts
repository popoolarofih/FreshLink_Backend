// ─────────────────────────────────────────────────────────────────────────────
// groq-client.types.ts
//
// Shared types used by GroqClientService and every consumer module
// (matchmaking, pricing, contracts, search-parsing).
// Import from here — never import groq-sdk types directly in domain code.
// ─────────────────────────────────────────────────────────────────────────────

// ── Inbound call options ─────────────────────────────────────────────────────

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqChatOptions {
  /** Groq model id. Defaults to GROQ_MODEL_REASONING if omitted. */
  model?: string;
  /** Sampling temperature 0-2. Default 0.2 for structured outputs. */
  temperature?: number;
  /** Max completion tokens. Default 1024. */
  maxTokens?: number;
  /**
   * If true, response_format is set to { type: 'json_object' }.
   * Caller is responsible for JSON.parse-ing content.
   */
  jsonMode?: boolean;
}

// ── Outbound result ──────────────────────────────────────────────────────────

export interface GroqChatResult {
  /** The raw text content returned by the model. */
  content: string;
  /** Exact model string echoed back from the Groq response. */
  model: string;
  /** End-to-end latency in milliseconds (SDK call start → finish). */
  latencyMs: number;
  /** Number of prompt tokens consumed. */
  promptTokens: number;
  /** Number of completion tokens produced. */
  completionTokens: number;
}

// ── Error type ───────────────────────────────────────────────────────────────

/**
 * Thrown by GroqClientService when all retries are exhausted.
 * Consumer services catch this and fall back to deterministic logic.
 */
export class GroqUnavailableException extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'GroqUnavailableException';
  }
}

// ── Shared domain types (migrated/extended from ai-client.types.ts) ──────────

export interface BuyerContext {
  buyerId: string;
  preferences?: string[];
  dietaryTags?: string[];
  cuisineTags?: string[];
  location?: string;
  budget?: number;
  eventType?: string;
  /** Past order category history for preference weighting. */
  pastOrderCategories?: string[];
}

export interface CandidateProvider {
  id: string;
  name?: string;
  category: string;
  averageRating: number;
  responseRate?: number;
  /** Distance in km from buyer, if available. */
  distanceKm?: number;
  city?: string;
  basePrice?: number;
  tags?: string[];
  isAvailable?: boolean;
}

export interface RankedProvider extends CandidateProvider {
  /** Composite deterministic score 0-100. */
  deterministicScore: number;
  /** Final score after AI re-rank (equals deterministicScore on fallback). */
  score: number;
  /** Short "why this match" explanation, or 'fallback:deterministic' on error. */
  reasoning: string;
  /** True when Groq was unavailable and deterministic score was used as-is. */
  aiFallback?: boolean;
}

export interface ServiceContext {
  category: string;
  city?: string;
  providerRating?: number;
  guestCount?: number;
  durationHours?: number;
  eventType?: string;
  /** ISO date string for seasonality analysis. */
  eventDate?: string;
  /** Array of recent comparable order prices in the same category/city. */
  recentComparablePrices?: number[];
}

export interface PriceSuggestion {
  suggestedMin: number;
  suggestedMax: number;
  recommended: number;
  currency: string;
  rationale: string;
  /** True when Groq was unavailable and only statistical baseline was used. */
  aiFallback?: boolean;
}

export type ContractCategory =
  | 'catering'
  | 'meal_prep_subscription'
  | 'farm_supply'
  | 'event_bartending';

export interface OrderContext {
  orderId: string;
  buyerName: string;
  providerName: string;
  serviceDescription: string;
  category: ContractCategory;
  eventDate?: string;
  location?: string;
  agreedPrice?: number;
  currency?: string;
  guestCount?: number;
  specialRequirements?: string;
}

export interface ContractSection {
  title: string;
  content: string;
}

export interface ContractDraft {
  title: string;
  sections: ContractSection[];
  /** ISO timestamp of when the draft was generated. */
  generatedAt: string;
  /** Platform-norm deviation flags (e.g. 'cancellation window < 24h'). */
  flags: string[];
  /** True when Groq was unavailable and the fallback template was used. */
  aiFallback?: boolean;
}

export interface ParsedSearchFilters {
  category?: string;
  cuisineTags?: string[];
  dietaryTags?: string[];
  dateFrom?: string;
  dateTo?: string;
  maxPrice?: number;
  eventType?: string;
  location?: string;
  /** 0-1 confidence of the parse. < 0.5 = treat as low-confidence. */
  confidence: number;
  /** Original raw query, always preserved. */
  rawQuery: string;
}
