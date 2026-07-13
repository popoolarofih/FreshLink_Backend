export interface BuyerContext {
    buyerId: string;
    preferences?: string[];
    location?: string;
    budget?: number;
    eventType?: string;
}
export interface CandidateProvider {
    id: string;
    category: string;
    averageRating: number;
    city?: string;
    basePrice?: number;
    tags?: string[];
}
export interface RankedProvider extends CandidateProvider {
    score: number;
    reasoning?: string;
}
export interface ServiceContext {
    category: string;
    city?: string;
    guestCount?: number;
    durationHours?: number;
    eventType?: string;
}
export interface PriceSuggestion {
    suggestedMin: number;
    suggestedMax: number;
    currency: string;
    reasoning?: string;
}
export interface OrderContext {
    orderId: string;
    buyerName: string;
    providerName: string;
    serviceDescription: string;
    eventDate?: string;
    location?: string;
    agreedPrice?: number;
    currency?: string;
}
export interface ContractDraft {
    title: string;
    body: string;
    generatedAt: string;
}
export interface SearchFilters {
    category?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    tags?: string[];
    minRating?: number;
    availableFrom?: string;
    availableTo?: string;
}
