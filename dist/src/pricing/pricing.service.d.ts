import { Cache } from 'cache-manager';
import { GroqClientService } from '../groq-client/groq-client.service';
import { PriceSuggestion, ServiceContext } from '../groq-client/groq-client.types';
export declare class PricingService {
    private readonly groqClient;
    private readonly cacheManager;
    private readonly logger;
    private systemPrompt;
    constructor(groqClient: GroqClientService, cacheManager: Cache);
    private loadSystemPrompt;
    private calculateStatisticalBaseline;
    suggestPrice(context: ServiceContext): Promise<PriceSuggestion>;
}
