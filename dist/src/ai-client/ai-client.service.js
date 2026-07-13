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
var AiClientService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiClientService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let AiClientService = AiClientService_1 = class AiClientService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(AiClientService_1.name);
        const baseURL = config.get('AI_SERVICE_URL', 'http://localhost:4000');
        const apiKey = config.get('AI_SERVICE_API_KEY', '');
        const timeout = config.get('AI_SERVICE_TIMEOUT_MS', 5000);
        this.http = axios_1.default.create({
            baseURL,
            timeout,
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
            },
        });
    }
    async rankProviders(buyerContext, candidateProviders) {
        try {
            const { data } = await this.http.post('/rank-providers', {
                buyerContext,
                candidateProviders,
            });
            return data;
        }
        catch (err) {
            this.logger.warn(`rankProviders fallback: ${err.message}`);
            return candidateProviders
                .sort((a, b) => b.averageRating - a.averageRating)
                .map((p) => ({ ...p, score: p.averageRating, reasoning: 'fallback:rating-sort' }));
        }
    }
    async suggestPrice(serviceContext) {
        try {
            const { data } = await this.http.post('/suggest-price', serviceContext);
            return data;
        }
        catch (err) {
            this.logger.warn(`suggestPrice fallback: ${err.message}`);
            return {
                suggestedMin: 50000,
                suggestedMax: 500000,
                currency: 'NGN',
                reasoning: 'fallback:static-range',
            };
        }
    }
    async generateContract(orderContext) {
        try {
            const { data } = await this.http.post('/generate-contract', orderContext);
            return data;
        }
        catch (err) {
            this.logger.warn(`generateContract fallback: ${err.message}`);
            return {
                title: `Service Agreement – Order ${orderContext.orderId}`,
                body: [
                    `This agreement is between ${orderContext.buyerName} (Buyer) and`,
                    `${orderContext.providerName} (Provider) for the following service:`,
                    `"${orderContext.serviceDescription}".`,
                    orderContext.eventDate ? `Event Date: ${orderContext.eventDate}` : '',
                    orderContext.agreedPrice
                        ? `Agreed Price: ${orderContext.agreedPrice} ${orderContext.currency ?? 'NGN'}`
                        : '',
                    `\n[Auto-generated fallback template – please review and sign.]`,
                ]
                    .filter(Boolean)
                    .join('\n'),
                generatedAt: new Date().toISOString(),
            };
        }
    }
    async parseSearchQuery(rawQuery) {
        try {
            const { data } = await this.http.post('/parse-search', { rawQuery });
            return data;
        }
        catch (err) {
            this.logger.warn(`parseSearchQuery fallback: ${err.message}`);
            return {};
        }
    }
};
exports.AiClientService = AiClientService;
exports.AiClientService = AiClientService = AiClientService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiClientService);
//# sourceMappingURL=ai-client.service.js.map