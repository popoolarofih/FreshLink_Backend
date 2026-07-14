import { GroqClientService } from '../../groq-client/groq-client.service';
import { ContractDraft, OrderContext } from '../../groq-client/groq-client.types';
export declare class ContractsService {
    private readonly groqClient;
    private readonly logger;
    private templates;
    constructor(groqClient: GroqClientService);
    private loadTemplate;
    private replacePlaceholders;
    generateContract(context: OrderContext): Promise<ContractDraft>;
}
