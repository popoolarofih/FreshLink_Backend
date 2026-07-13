"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const subscriptions_service_1 = require("./subscriptions.service");
const subscriptions_controller_1 = require("./subscriptions.controller");
const subscriptions_processor_1 = require("./subscriptions.processor");
const subscriptions_scheduler_1 = require("./subscriptions.scheduler");
const notifications_module_1 = require("../notifications/notifications.module");
const subscriptions_constants_1 = require("./subscriptions.constants");
let SubscriptionsModule = class SubscriptionsModule {
};
exports.SubscriptionsModule = SubscriptionsModule;
exports.SubscriptionsModule = SubscriptionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bull_1.BullModule.registerQueue({ name: subscriptions_constants_1.SUBSCRIPTIONS_QUEUE }),
            notifications_module_1.NotificationsModule,
        ],
        controllers: [subscriptions_controller_1.SubscriptionsController],
        providers: [
            subscriptions_service_1.SubscriptionsService,
            subscriptions_processor_1.SubscriptionsProcessor,
            subscriptions_scheduler_1.SubscriptionsScheduler,
        ],
        exports: [subscriptions_service_1.SubscriptionsService],
    })
], SubscriptionsModule);
//# sourceMappingURL=subscriptions.module.js.map