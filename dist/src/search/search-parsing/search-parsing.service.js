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
var SearchParsingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchParsingService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const groq_client_service_1 = require("../../groq-client/groq-client.service");
const parsed_filters_dto_1 = require("./dto/parsed-filters.dto");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
let SearchParsingService = SearchParsingService_1 = class SearchParsingService {
    constructor(groqClient, cacheManager) {
        this.groqClient = groqClient;
        this.cacheManager = cacheManager;
        this.logger = new common_1.Logger(SearchParsingService_1.name);
        this.systemPrompt = '';
    }
    async loadSystemPrompt() {
        if (this.systemPrompt)
            return this.systemPrompt;
        try {
            const filePath = path.join(process.cwd(), 'prompts', 'search-parsing.prompt.txt');
            this.systemPrompt = await fs.readFile(filePath, 'utf8');
            return this.systemPrompt;
        }
        catch (err) {
            this.logger.error(`Failed to load search-parsing prompt: ${err}`);
            return 'Extract filters in JSON mode.';
        }
    }
    async parseQuery(rawQuery) {
        if (!rawQuery || !rawQuery.trim()) {
            return { confidence: 0, rawQuery };
        }
        const cacheKey = `search_parse:${rawQuery.trim().toLowerCase()}`;
        try {
            const cached = await this.cacheManager.get(cacheKey);
            if (cached) {
                this.logger.log(`Search parse cache hit for query: "${rawQuery}"`);
                return cached;
            }
        }
        catch (err) {
            this.logger.warn(`Failed to read from cache: ${err}`);
        }
        const fallback = {
            confidence: 0,
            rawQuery,
        };
        try {
            const systemPromptBase = await this.loadSystemPrompt();
            const todayIso = new Date().toISOString().split('T')[0];
            const systemPrompt = `${systemPromptBase}\n\nToday's date is: ${todayIso}`;
            const response = await this.groqClient.chat([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Query: "${rawQuery}"` },
            ], {
                model: this.groqClient.fastModel,
                temperature: 0.1,
                jsonMode: true,
            });
            const parsedJson = JSON.parse(response.content);
            const dtoInstance = (0, class_transformer_1.plainToInstance)(parsed_filters_dto_1.ParsedFiltersDto, parsedJson);
            const errors = await (0, class_validator_1.validate)(dtoInstance);
            if (errors.length > 0) {
                this.logger.warn(`Validation failed for parsed filters: ${JSON.stringify(errors)}`);
                return fallback;
            }
            const result = {
                category: dtoInstance.category,
                cuisineTags: dtoInstance.cuisineTags,
                dietaryTags: dtoInstance.dietaryTags,
                dateFrom: dtoInstance.dateFrom,
                dateTo: dtoInstance.dateTo,
                maxPrice: dtoInstance.maxPrice,
                eventType: dtoInstance.eventType,
                location: dtoInstance.location,
                confidence: dtoInstance.confidence ?? 0.5,
                rawQuery,
            };
            try {
                await this.cacheManager.set(cacheKey, result, 3600_000);
            }
            catch (err) {
                this.logger.warn(`Failed to write to cache: ${err}`);
            }
            return result;
        }
        catch (err) {
            this.logger.error(`Error in parseQuery: ${err}`);
            return fallback;
        }
    }
};
exports.SearchParsingService = SearchParsingService;
exports.SearchParsingService = SearchParsingService = SearchParsingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [groq_client_service_1.GroqClientService, Object])
], SearchParsingService);
//# sourceMappingURL=search-parsing.service.js.map