import { GroqClientService } from './groq-client/groq-client.service';
export declare class AppService {
    private readonly groqClient;
    constructor(groqClient: GroqClientService);
    getHealth(): Promise<Record<string, unknown>>;
}
