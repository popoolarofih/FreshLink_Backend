import { ConfigService } from '@nestjs/config';
import { BuyerContext, CandidateProvider, ContractDraft, OrderContext, PriceSuggestion, RankedProvider, SearchFilters, ServiceContext } from './ai-client.types';
export declare class AiClientService {
    private readonly config;
    private readonly logger;
    private readonly http;
    constructor(config: ConfigService);
    rankProviders(buyerContext: BuyerContext, candidateProviders: CandidateProvider[]): Promise<RankedProvider[]>;
    suggestPrice(serviceContext: ServiceContext): Promise<PriceSuggestion>;
    generateContract(orderContext: OrderContext): Promise<ContractDraft>;
    parseSearchQuery(rawQuery: string): Promise<SearchFilters>;
}
