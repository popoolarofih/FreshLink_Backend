"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PricingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const groq_client_service_1 = require("../groq-client/groq-client.service");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
let PricingService = PricingService_1 = class PricingService {
    constructor(groqClient, cacheManager) {
        this.groqClient = groqClient;
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(PricingService_1.name);
        this.systemPrompt = '';
    }
    async loadSystemPrompt() {
        if (this.systemPrompt)
            return this.systemPrompt;
        try {
            const filePath = path.join(process.cwd(), 'prompts', 'pricing.prompt.txt');
            this.systemPrompt = await fs.readFile(filePath, 'utf8');
            return this.systemPrompt;
        }
        catch (err) {
            this.logger.error(`Failed to load pricing prompt: ${err}`);
            return 'Analyze pricing and suggest adjustments based on seasonality.';
        }
    }
    calculateStatisticalBaseline(category, prices) {
        if (!prices || prices.length === 0) {
            let defaultMedian = 100000;
            let defaultIqr = 30000;
            const catLower = category.toLowerCase();
            if (catLower.includes('catering')) {
                defaultMedian = 150000;
                defaultIqr = 50000;
            }
            else if (catLower.includes('meal_prep') || catLower.includes('subscription')) {
                defaultMedian = 50000;
                defaultIqr = 15000;
            }
            else if (catLower.includes('farm')) {
                defaultMedian = 80000;
                defaultIqr = 20000;
            }
            else if (catLower.includes('bartend') || catLower.includes('bar')) {
                defaultMedian = 60000;
                defaultIqr = 15000;
            }
            return {
                min: Math.max(1000, defaultMedian - 1.5 * defaultIqr),
                max: defaultMedian + 1.5 * defaultIqr,
                median: defaultMedian,
            };
        }
        const sorted = [...prices].sort((a, b) => a - b);
        const len = sorted.length;
        const mid = Math.floor(len / 2);
        const median = len % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        const getPercentile = (p) => {
            const idx = (len - 1) * p;
            const base = Math.floor(idx);
            const rest = idx - base;
            if (sorted[base + 1] !== undefined) {
                return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
            }
            return sorted[base];
        };
        const q1 = getPercentile(0.25);
        const q3 = getPercentile(0.75);
        const iqr = q3 - q1 || median * 0.2;
        const minBound = Math.max(1000, median - 1.5 * iqr);
        const maxBound = median + 1.5 * iqr;
        return {
            min: Math.round(minBound),
            max: Math.round(maxBound),
            median: Math.round(median),
        };
    }
    async suggestPrice(context) {
        const prices = context.recentComparablePrices || [];
        const stats = this.calculateStatisticalBaseline(context.category, prices);
        const cleanCity = (context.city || 'default').toLowerCase().trim();
        const cleanCategory = context.category.toLowerCase().trim();
        const cleanRating = context.providerRating ?? 0;
        const cleanDate = (context.eventDate || new Date().toISOString().split('T')[0]).slice(0, 10);
        const pricesStr = prices.join('-');
        const cacheKey = `price_suggest:${cleanCategory}:${cleanCity}:${cleanRating}:${cleanDate}:${pricesStr}`;
        try {
            const cached = await this.cacheManager.get(cacheKey);
            if (cached) {
                this.logger.log(`Pricing suggestion cache hit for key: ${cacheKey}`);
                return cached;
            }
        }
        catch (err) {
            this.logger.warn(`Failed to read from cache: ${err}`);
        }
        const fallbackResult = {
            suggestedMin: stats.min,
            suggestedMax: stats.max,
            recommended: stats.median,
            currency: 'NGN',
            rationale: 'fallback:statistical-baseline',
            aiFallback: true,
        };
        try {
            const systemPrompt = await this.loadSystemPrompt();
            const userContent = {
                serviceContext: {
                    category: context.category,
                    city: context.city,
                    providerRating: context.providerRating,
                    guestCount: context.guestCount,
                    durationHours: context.durationHours,
                    eventType: context.eventType,
                    eventDate: context.eventDate,
                },
                statisticalBaseline: stats,
            };
            const response = await this.groqClient.chat([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: JSON.stringify(userContent) },
            ], {
                model: this.groqClient.reasoningModel,
                temperature: 0.2,
                jsonMode: true,
            });
            const parsed = JSON.parse(response.content);
            const clamp = (val, base) => {
                const minAllowed = base * 0.7;
                const maxAllowed = base * 1.3;
                return Math.round(Math.min(maxAllowed, Math.max(minAllowed, val)));
            };
            const suggestedMin = clamp(parsed.suggestedMin ?? stats.min, stats.min);
            const suggestedMax = clamp(parsed.suggestedMax ?? stats.max, stats.max);
            const recommended = clamp(parsed.recommended ?? stats.median, stats.median);
            const result = {
                suggestedMin,
                suggestedMax,
                recommended,
                currency: 'NGN',
                rationale: parsed.rationale || 'Suggested based on baseline statistical ranges and seasonal adjustments.',
                aiFallback: false,
            };
            try {
                await this.cacheManager.set(cacheKey, result, 3600_000);
            }
            catch (err) {
                this.logger.warn(`Failed to write pricing result to cache: ${err}`);
            }
            return result;
        }
        catch (err) {
            this.logger.warn(`PricingService fallback kicked in: ${err instanceof Error ? err.message : err}. Flag: ai_fallback=true`);
            return fallbackResult;
        }
    }
};
exports.PricingService = PricingService;
exports.PricingService = PricingService = PricingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [groq_client_service_1.GroqClientService, Object])
], PricingService);
//# sourceMappingURL=pricing.service.js.map