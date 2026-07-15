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
var OrdersProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const orders_constants_1 = require("./orders.constants");
let OrdersProcessor = OrdersProcessor_1 = class OrdersProcessor {
    constructor() {
        this.logger = new common_1.Logger(OrdersProcessor_1.name);
    }
    async handleStatusChanged(job) {
        const { orderId, newStatus } = job.data;
        this.logger.log(`Order ${orderId} transitioned to ${newStatus}`);
        switch (newStatus) {
            case client_1.OrderStatus.CONTRACT_SIGNED:
                this.logger.log(`[TODO] Generate contract PDF for order ${orderId}`);
                break;
            case client_1.OrderStatus.DELIVERED:
                this.logger.log(`[TODO] Prompt buyer to confirm delivery and release funds for ${orderId}`);
                break;
            default:
                break;
        }
    }
};
exports.OrdersProcessor = OrdersProcessor;
__decorate([
    (0, bull_1.Process)('status-changed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrdersProcessor.prototype, "handleStatusChanged", null);
exports.OrdersProcessor = OrdersProcessor = OrdersProcessor_1 = __decorate([
    (0, bull_1.Processor)(orders_constants_1.ORDERS_QUEUE)
], OrdersProcessor);
//# sourceMappingURL=orders.processor.js.map