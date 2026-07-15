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
var SubscriptionsScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsScheduler = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const subscriptions_constants_1 = require("./subscriptions.constants");
let SubscriptionsScheduler = SubscriptionsScheduler_1 = class SubscriptionsScheduler {
    constructor(queue) {
        this.queue = queue;
        this.logger = new common_1.Logger(SubscriptionsScheduler_1.name);
    }
    async onModuleInit() {
        await this.queue.add('check-expirations', {}, { repeat: { cron: '0 0 * * *' }, jobId: 'sub-expiry-cron' });
        await this.queue.add('send-reminders', {}, { repeat: { cron: '0 9 * * *' }, jobId: 'sub-reminder-cron' });
        this.logger.log('Subscription cron jobs registered.');
    }
};
exports.SubscriptionsScheduler = SubscriptionsScheduler;
exports.SubscriptionsScheduler = SubscriptionsScheduler = SubscriptionsScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)(subscriptions_constants_1.SUBSCRIPTIONS_QUEUE)),
    __metadata("design:paramtypes", [Object])
], SubscriptionsScheduler);
//# sourceMappingURL=subscriptions.scheduler.js.map