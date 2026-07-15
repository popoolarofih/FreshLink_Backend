import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GroqChatOptions, GroqChatResult, GroqMessage } from './groq-client.types';
export declare class GroqClientService implements OnModuleInit {
    private readonly config;
    private readonly logger;
    private readonly groq;
    private readonly modelFast;
    private readonly modelReasoning;
    private readonly timeoutMs;
    private readonly maxRetries;
    constructor(config: ConfigService);
    onModuleInit(): void;
    get fastModel(): string;
    get reasoningModel(): string;
    chat(messages: GroqMessage[], options?: GroqChatOptions): Promise<GroqChatResult>;
    ping(): Promise<{
        reachable: boolean;
        model: string;
        latencyMs: number;
    }>;
    private sleep;
    private truncateForLog;
}
