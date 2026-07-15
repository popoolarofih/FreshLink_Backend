import { GroqClientService } from '../../groq-client/groq-client.service';
import { BuyerContext, CandidateProvider, RankedProvider } from '../../groq-client/groq-client.types';
export declare class MatchmakingService {
    private readonly groqClient;
    private readonly logger;
    private systemPrompt;
    constructor(groqClient: GroqClientService);
    private loadSystemPrompt;
    private calculateDeterministicScore;
    rankProviders(buyerContext: BuyerContext, candidateProviders: CandidateProvider[]): Promise<RankedProvider[]>;
}
