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
var ContractsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractsService = void 0;
const common_1 = require("@nestjs/common");
const groq_client_service_1 = require("../../groq-client/groq-client.service");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
let ContractsService = ContractsService_1 = class ContractsService {
    constructor(groqClient) {
        this.groqClient = groqClient;
        this.logger = new common_1.Logger(ContractsService_1.name);
        this.templates = {};
    }
    async loadTemplate(category) {
        if (this.templates[category])
            return this.templates[category];
        try {
            const filePath = path.join(process.cwd(), 'prompts', 'contracts', `${category}.prompt.txt`);
            const content = await fs.readFile(filePath, 'utf8');
            this.templates[category] = content;
            return content;
        }
        catch (err) {
            this.logger.error(`Failed to load contract template for ${category}: ${err}`);
            return 'Generate contract draft.';
        }
    }
    replacePlaceholders(template, context) {
        let result = template;
        const values = {
            buyerName: context.buyerName || 'Buyer',
            providerName: context.providerName || 'Provider',
            serviceDescription: context.serviceDescription || 'No description provided',
            eventDate: context.eventDate || 'N/A',
            agreedPrice: context.agreedPrice ? String(context.agreedPrice) : 'N/A',
            currency: context.currency || 'NGN',
            guestCount: context.guestCount ? String(context.guestCount) : 'N/A',
            specialRequirements: context.specialRequirements || 'None',
        };
        for (const [key, val] of Object.entries(values)) {
            result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), val);
        }
        return result;
    }
    async generateContract(context) {
        const fallbackTitle = `Service Agreement – Order ${context.orderId}`;
        const fallbackSections = [
            {
                title: '1. Parties and Description',
                content: `This agreement is between ${context.buyerName} (Buyer) and ${context.providerName} (Provider) for: "${context.serviceDescription}".`,
            },
            {
                title: '2. Payment Terms',
                content: context.agreedPrice
                    ? `Agreed Price: ${context.agreedPrice} ${context.currency ?? 'NGN'}`
                    : 'Price to be determined.',
            },
            {
                title: '3. Event Date / Schedule',
                content: context.eventDate ? `Date: ${context.eventDate}` : 'Date: N/A',
            },
            {
                title: '4. Standard Cancellation Policy',
                content: 'Cancellation within 48 hours of service start is subject to a 50% penalty.',
            },
            {
                title: '5. Dispute Resolution',
                content: 'Any dispute arising under this agreement will be mediated via the FreshLink platform.',
            },
        ];
        try {
            const template = await this.loadTemplate(context.category);
            const promptContent = this.replacePlaceholders(template, context);
            const response = await this.groqClient.chat([
                { role: 'system', content: 'You are an AI assistant drafting contracts in JSON mode.' },
                { role: 'user', content: promptContent },
            ], {
                model: this.groqClient.reasoningModel,
                temperature: 0.2,
                jsonMode: true,
            });
            const parsed = JSON.parse(response.content);
            const flags = parsed.flags || [];
            if (context.specialRequirements && context.specialRequirements.toLowerCase().includes('no cancellation')) {
                flags.push('Contract prohibits cancellations completely, deviating from standard platform terms.');
            }
            return {
                title: parsed.title || fallbackTitle,
                sections: parsed.sections || fallbackSections,
                generatedAt: new Date().toISOString(),
                flags,
                aiFallback: false,
            };
        }
        catch (err) {
            this.logger.warn(`ContractsService fallback kicked in: ${err instanceof Error ? err.message : err}. Flag: ai_fallback=true`);
            return {
                title: fallbackTitle,
                sections: fallbackSections,
                generatedAt: new Date().toISOString(),
                flags: ['fallback:standard-platform-contract-used'],
                aiFallback: true,
            };
        }
    }
};
exports.ContractsService = ContractsService;
exports.ContractsService = ContractsService = ContractsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [groq_client_service_1.GroqClientService])
], ContractsService);
//# sourceMappingURL=contracts.service.js.map