"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var FlutterwaveProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlutterwaveProvider = void 0;
const common_1 = require("@nestjs/common");
let FlutterwaveProvider = FlutterwaveProvider_1 = class FlutterwaveProvider {
    constructor() {
        this.logger = new common_1.Logger(FlutterwaveProvider_1.name);
    }
    async createPaymentIntent(_params) {
        throw new Error('FlutterwaveProvider not implemented yet.');
    }
    async capturePayment(_intentId) {
        throw new Error('FlutterwaveProvider not implemented yet.');
    }
    async refundPayment(_chargeId, _amount) {
        throw new Error('FlutterwaveProvider not implemented yet.');
    }
};
exports.FlutterwaveProvider = FlutterwaveProvider;
exports.FlutterwaveProvider = FlutterwaveProvider = FlutterwaveProvider_1 = __decorate([
    (0, common_1.Injectable)()
], FlutterwaveProvider);
//# sourceMappingURL=flutterwave.provider.js.map