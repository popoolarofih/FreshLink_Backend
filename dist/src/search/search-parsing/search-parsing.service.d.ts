import { Cache } from 'cache-manager';
import { GroqClientService } from '../../groq-client/groq-client.service';
import { ParsedSearchFilters } from '../../groq-client/groq-client.types';
export declare class SearchParsingService {
    private readonly groqClient;
    private readonly cacheManager;
    private readonly logger;
    private systemPrompt;
    constructor(groqClient: GroqClientService, cacheManager: Cache);
    private loadSystemPrompt;
    parseQuery(rawQuery: string): Promise<ParsedSearchFilters>;
}
