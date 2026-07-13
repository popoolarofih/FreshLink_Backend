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
var NotificationsProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const notifications_constants_1 = require("./notifications.constants");
let NotificationsProcessor = NotificationsProcessor_1 = class NotificationsProcessor {
    constructor() {
        this.logger = new common_1.Logger(NotificationsProcessor_1.name);
    }
    async handleDeliver(job) {
        const { notificationId, userId, type, title, body } = job.data;
        this.logger.log(`[STUB] Delivering notification ${notificationId} to user ${userId} | type=${type} | "${title}": ${body}`);
    }
};
exports.NotificationsProcessor = NotificationsProcessor;
__decorate([
    (0, bull_1.Process)('deliver'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsProcessor.prototype, "handleDeliver", null);
exports.NotificationsProcessor = NotificationsProcessor = NotificationsProcessor_1 = __decorate([
    (0, bull_1.Processor)(notifications_constants_1.NOTIFICATIONS_QUEUE)
], NotificationsProcessor);
//# sourceMappingURL=notifications.processor.js.map