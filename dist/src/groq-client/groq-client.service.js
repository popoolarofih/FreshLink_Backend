"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var GroqClientService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroqClientService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const groq_client_types_1 = require("./groq-client.types");
let GroqClientService = GroqClientService_1 = class GroqClientService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(GroqClientService_1.name);
        const apiKey = config.get('GROQ_API_KEY', '');
        this.modelFast = config.get('GROQ_MODEL_FAST', 'llama-3.1-8b-instant');
        this.modelReasoning = config.get('GROQ_MODEL_REASONING', 'llama-3.3-70b-versatile');
        this.timeoutMs = config.get('GROQ_TIMEOUT_MS', 10_000);
        this.maxRetries = config.get('GROQ_MAX_RETRIES', 3);
        this.groq = new groq_sdk_1.default({ apiKey, maxRetries: 0 });
    }
    onModuleInit() {
        if (!this.config.get('GROQ_API_KEY')) {
            this.logger.warn('GROQ_API_KEY is not set. All Groq calls will fail and ' +
                'services will fall back to deterministic logic.');
        }
        else {
            this.logger.log(`GroqClientService ready — fast: ${this.modelFast}, ` +
                `reasoning: ${this.modelReasoning}, ` +
                `timeout: ${this.timeoutMs}ms, maxRetries: ${this.maxRetries}`);
        }
    }
    get fastModel() {
        return this.modelFast;
    }
    get reasoningModel() {
        return this.modelReasoning;
    }
    async chat(messages, options = {}) {
        const model = options.model ?? this.modelReasoning;
        const temperature = options.temperature ?? 0.2;
        const maxTokens = options.maxTokens ?? 1024;
        let attempt = 0;
        let lastError;
        while (attempt < this.maxRetries) {
            attempt++;
            const started = Date.now();
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), this.timeoutMs);
                let completion;
                try {
                    completion = await this.groq.chat.completions.create({
                        model,
                        messages: messages.map((m) => ({
                            role: m.role,
                            content: m.content,
                        })),
                        temperature,
                        max_tokens: maxTokens,
                        ...(options.jsonMode
                            ? { response_format: { type: 'json_object' } }
                            : {}),
                    }, { signal: controller.signal });
                }
                finally {
                    clearTimeout(timer);
                }
                const latencyMs = Date.now() - started;
                const choice = completion.choices[0];
                const content = choice?.message?.content ?? '';
                const usage = completion.usage;
                const result = {
                    content,
                    model: completion.model,
                    latencyMs,
                    promptTokens: usage?.prompt_tokens ?? 0,
                    completionTokens: usage?.completion_tokens ?? 0,
                };
                this.logger.log(JSON.stringify({
                    event: 'groq_call_success',
                    model: result.model,
                    latencyMs,
                    promptTokens: result.promptTokens,
                    completionTokens: result.completionTokens,
                    attempt,
                    contextPreview: this.truncateForLog(messages),
                    outputPreview: content.slice(0, 200),
                }));
                return result;
            }
            catch (err) {
                lastError = err;
                const latencyMs = Date.now() - started;
                const isAbort = err instanceof Error && err.name === 'AbortError';
                const isTimeout = isAbort;
                const errMsg = err instanceof Error ? err.message : String(err);
                this.logger.warn(JSON.stringify({
                    event: 'groq_call_failure',
                    model,
                    latencyMs,
                    attempt,
                    maxRetries: this.maxRetries,
                    error: errMsg,
                    isTimeout,
                }));
                if (attempt < this.maxRetries) {
                    const backoffMs = Math.min(500 * 2 ** (attempt - 1), 8_000);
                    this.logger.log(`Groq retry ${attempt}/${this.maxRetries} in ${backoffMs}ms…`);
                    await this.sleep(backoffMs);
                }
            }
        }
        throw new groq_client_types_1.GroqUnavailableException(`Groq unavailable after ${this.maxRetries} attempts`, lastError);
    }
    async ping() {
        const started = Date.now();
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 5_000);
            try {
                await this.groq.chat.completions.create({
                    model: this.modelFast,
                    messages: [{ role: 'user', content: 'ping' }],
                    max_tokens: 1,
                }, { signal: controller.signal });
            }
            finally {
                clearTimeout(timer);
            }
            return {
                reachable: true,
                model: this.modelFast,
                latencyMs: Date.now() - started,
            };
        }
        catch {
            return {
                reachable: false,
                model: this.modelFast,
                latencyMs: Date.now() - started,
            };
        }
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    truncateForLog(messages) {
        return messages.map((m) => ({
            role: m.role,
            contentPreview: m.content.slice(0, 150),
        }));
    }
};
exports.GroqClientService = GroqClientService;
exports.GroqClientService = GroqClientService = GroqClientService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GroqClientService);
//# sourceMappingURL=groq-client.service.js.map