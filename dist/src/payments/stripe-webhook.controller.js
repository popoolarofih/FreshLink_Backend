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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var StripeWebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeWebhookController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const stripe_1 = __importDefault(require("stripe"));
const payments_service_1 = require("./payments.service");
let StripeWebhookController = StripeWebhookController_1 = class StripeWebhookController {
    constructor(paymentsService, config) {
        this.paymentsService = paymentsService;
        this.config = config;
        this.logger = new common_1.Logger(StripeWebhookController_1.name);
        this.stripe = new stripe_1.default(config.get('STRIPE_SECRET_KEY', 'sk_test_placeholder'), { apiVersion: '2026-06-24.dahlia' });
        this.webhookSecret = config.get('STRIPE_WEBHOOK_SECRET', '');
    }
    async handleWebhook(req, sig) {
        if (!this.webhookSecret) {
            this.logger.warn('STRIPE_WEBHOOK_SECRET not set — skipping signature verification');
        }
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(req.rawBody, sig, this.webhookSecret);
        }
        catch (err) {
            this.logger.error(`Webhook signature verification failed: ${err.message}`);
            throw new common_1.BadRequestException('Invalid Stripe webhook signature.');
        }
        this.logger.log(`Stripe event received: ${event.type}`);
        switch (event.type) {
            case 'payment_intent.amount_capturable_updated': {
                const pi = event.data.object;
                await this.paymentsService.markHeld(pi.id);
                break;
            }
            case 'payment_intent.payment_failed': {
                const pi = event.data.object;
                this.logger.warn(`Payment failed for intent ${pi.id}: ${pi.last_payment_error?.message}`);
                break;
            }
            default:
                this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
        }
        return { received: true };
    }
};
exports.StripeWebhookController = StripeWebhookController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('stripe-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], StripeWebhookController.prototype, "handleWebhook", null);
exports.StripeWebhookController = StripeWebhookController = StripeWebhookController_1 = __decorate([
    (0, swagger_1.ApiExcludeController)(),
    (0, common_1.Controller)('payments/webhook'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService,
        config_1.ConfigService])
], StripeWebhookController);
//# sourceMappingURL=stripe-webhook.controller.js.map