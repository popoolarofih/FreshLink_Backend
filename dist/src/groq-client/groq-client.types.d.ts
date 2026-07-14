export interface GroqMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface GroqChatOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
}
export interface GroqChatResult {
    content: string;
    model: string;
    latencyMs: number;
    promptTokens: number;
    completionTokens: number;
}
export declare class GroqUnavailableException extends Error {
    readonly cause?: unknown | undefined;
    constructor(message: string, cause?: unknown | undefined);
}
export interface BuyerContext {
    buyerId: string;
    preferences?: string[];
    dietaryTags?: string[];
    cuisineTags?: string[];
    location?: string;
    budget?: number;
    eventType?: string;
    pastOrderCategories?: string[];
}
export interface CandidateProvider {
    id: string;
    name?: string;
    category: string;
    averageRating: number;
    responseRate?: number;
    distanceKm?: number;
    city?: string;
    basePrice?: number;
    tags?: string[];
    isAvailable?: boolean;
}
export interface RankedProvider extends CandidateProvider {
    deterministicScore: number;
    score: number;
    reasoning: string;
    aiFallback?: boolean;
}
export interface ServiceContext {
    category: string;
    city?: string;
    providerRating?: number;
    guestCount?: number;
    durationHours?: number;
    eventType?: string;
    eventDate?: string;
    recentComparablePrices?: number[];
}
export interface PriceSuggestion {
    suggestedMin: number;
    suggestedMax: number;
    recommended: number;
    currency: string;
    rationale: string;
    aiFallback?: boolean;
}
export type ContractCategory = 'catering' | 'meal_prep_subscription' | 'farm_supply' | 'event_bartending';
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
    generatedAt: string;
    flags: string[];
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
    confidence: number;
    rawQuery: string;
}
