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
var StripeProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = __importDefault(require("stripe"));
let StripeProvider = StripeProvider_1 = class StripeProvider {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(StripeProvider_1.name);
        this.stripe = new stripe_1.default(config.get('STRIPE_SECRET_KEY', 'sk_test_placeholder'), { apiVersion: '2026-06-24.dahlia' });
    }
    async createPaymentIntent(params) {
        const intent = await this.stripe.paymentIntents.create({
            amount: params.amount,
            currency: params.currency.toLowerCase(),
            capture_method: 'manual',
            metadata: { orderId: params.orderId, ...params.metadata },
            ...(params.customerId && { customer: params.customerId }),
        });
        return {
            providerIntentId: intent.id,
            clientSecret: intent.client_secret ?? undefined,
            status: intent.status,
        };
    }
    async capturePayment(intentId) {
        const intent = await this.stripe.paymentIntents.capture(intentId);
        return {
            providerChargeId: intent.latest_charge,
            status: intent.status,
        };
    }
    async refundPayment(chargeId, amount) {
        const refund = await this.stripe.refunds.create({
            charge: chargeId,
            ...(amount !== undefined && { amount }),
        });
        return { refundId: refund.id, status: refund.status ?? 'unknown' };
    }
};
exports.StripeProvider = StripeProvider;
exports.StripeProvider = StripeProvider = StripeProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StripeProvider);
//# sourceMappingURL=stripe.provider.js.map