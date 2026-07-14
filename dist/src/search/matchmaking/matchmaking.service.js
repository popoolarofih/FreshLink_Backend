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
var MatchmakingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchmakingService = void 0;
const common_1 = require("@nestjs/common");
const groq_client_service_1 = require("../../groq-client/groq-client.service");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
let MatchmakingService = MatchmakingService_1 = class MatchmakingService {
    constructor(groqClient) {
        this.groqClient = groqClient;
        this.logger = new common_1.Logger(MatchmakingService_1.name);
        this.systemPrompt = '';
    }
    async loadSystemPrompt() {
        if (this.systemPrompt)
            return this.systemPrompt;
        try {
            const filePath = path.join(process.cwd(), 'prompts', 'matchmaking.prompt.txt');
            this.systemPrompt = await fs.readFile(filePath, 'utf8');
            return this.systemPrompt;
        }
        catch (err) {
            this.logger.error(`Failed to load matchmaking prompt: ${err}`);
            return 'Rank these food providers and give a one-sentence reasoning.';
        }
    }
    calculateDeterministicScore(buyer, provider) {
        let score = 0;
        let totalWeight = 0;
        totalWeight += 25;
        if (buyer.location && provider.city) {
            if (buyer.location.toLowerCase() === provider.city.toLowerCase()) {
                score += 25;
            }
        }
        else if (provider.distanceKm !== undefined) {
            const distScore = Math.max(0, 100 - provider.distanceKm * 5);
            score += (distScore / 100) * 25;
        }
        else {
            score += 15;
        }
        totalWeight += 25;
        const ratingScore = Math.min(100, Math.max(0, provider.averageRating * 20));
        score += (ratingScore / 100) * 25;
        totalWeight += 20;
        if (buyer.budget && provider.basePrice) {
            if (provider.basePrice <= buyer.budget) {
                score += 20;
            }
            else {
                const overBudgetRatio = provider.basePrice / buyer.budget;
                const pricePenalty = Math.max(0, 20 - (overBudgetRatio - 1) * 20);
                score += pricePenalty;
            }
        }
        else {
            score += 15;
        }
        totalWeight += 20;
        const providerTags = provider.tags || [];
        const buyerTags = [
            ...(buyer.preferences || []),
            ...(buyer.dietaryTags || []),
            ...(buyer.cuisineTags || []),
        ];
        if (buyerTags.length > 0 && providerTags.length > 0) {
            const matchCount = providerTags.filter((t) => buyerTags.some((bt) => bt.toLowerCase() === t.toLowerCase())).length;
            const tagMatchScore = Math.min(100, (matchCount / buyerTags.length) * 100);
            score += (tagMatchScore / 100) * 20;
        }
        else {
            score += 10;
        }
        totalWeight += 10;
        const responseRate = provider.responseRate ?? 100;
        score += (responseRate / 100) * 10;
        return Math.round((score / totalWeight) * 100);
    }
    async rankProviders(buyerContext, candidateProviders) {
        if (candidateProviders.length === 0) {
            return [];
        }
        const candidatesWithDeterministicScores = candidateProviders.map((p) => {
            const detScore = this.calculateDeterministicScore(buyerContext, p);
            return {
                ...p,
                deterministicScore: detScore,
                score: detScore,
                reasoning: 'fallback:deterministic',
            };
        });
        candidatesWithDeterministicScores.sort((a, b) => b.deterministicScore - a.deterministicScore);
        if (candidatesWithDeterministicScores.length === 0) {
            return [];
        }
        const topNCount = 5;
        const topCandidates = candidatesWithDeterministicScores.slice(0, topNCount);
        const restCandidates = candidatesWithDeterministicScores.slice(topNCount);
        try {
            const systemPrompt = await this.loadSystemPrompt();
            const userMessage = {
                buyerContext,
                candidates: topCandidates.map((c) => ({
                    id: c.id,
                    category: c.category,
                    averageRating: c.averageRating,
                    city: c.city,
                    basePrice: c.basePrice,
                    tags: c.tags,
                    deterministicScore: c.deterministicScore,
                })),
            };
            const response = await this.groqClient.chat([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: JSON.stringify(userMessage) },
            ], {
                model: this.groqClient.fastModel,
                temperature: 0.2,
                jsonMode: true,
            });
            const parsed = JSON.parse(response.content);
            const rankedMap = new Map();
            if (parsed && Array.isArray(parsed.rankedProviders)) {
                for (const item of parsed.rankedProviders) {
                    rankedMap.set(item.id, {
                        score: item.score,
                        reasoning: item.reasoning,
                    });
                }
            }
            const reRankedTop = topCandidates.map((c) => {
                const groqResult = rankedMap.get(c.id);
                if (groqResult) {
                    return {
                        ...c,
                        score: groqResult.score,
                        reasoning: groqResult.reasoning,
                        aiFallback: false,
                    };
                }
                return c;
            });
            const finalResults = [...reRankedTop, ...restCandidates].sort((a, b) => b.score - a.score);
            return finalResults;
        }
        catch (err) {
            this.logger.warn(`Matchmaking fallback kicked in: ${err instanceof Error ? err.message : err}. Flag: ai_fallback=true`);
            return candidatesWithDeterministicScores.map((c) => ({
                ...c,
                aiFallback: true,
            }));
        }
    }
};
exports.MatchmakingService = MatchmakingService;
exports.MatchmakingService = MatchmakingService = MatchmakingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [groq_client_service_1.GroqClientService])
], MatchmakingService);
//# sourceMappingURL=matchmaking.service.js.map