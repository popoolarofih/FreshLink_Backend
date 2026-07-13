"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const bull_1 = require("@nestjs/bull");
const cache_manager_1 = require("@nestjs/cache-manager");
const redis_1 = __importDefault(require("@keyv/redis"));
const keyv_1 = __importDefault(require("keyv"));
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const providers_module_1 = require("./providers/providers.module");
const search_module_1 = require("./search/search.module");
const orders_module_1 = require("./orders/orders.module");
const payments_module_1 = require("./payments/payments.module");
const reviews_module_1 = require("./reviews/reviews.module");
const subscriptions_module_1 = require("./subscriptions/subscriptions.module");
const notifications_module_1 = require("./notifications/notifications.module");
const ai_client_module_1 = require("./ai-client/ai-client.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
            throttler_1.ThrottlerModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => [
                    {
                        ttl: config.get('THROTTLE_TTL', 60000),
                        limit: config.get('THROTTLE_LIMIT', 100),
                    },
                ],
            }),
            cache_manager_1.CacheModule.registerAsync({
                isGlobal: true,
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const redisUrl = config.get('REDIS_URL', 'redis://localhost:6379');
                    return {
                        stores: [new keyv_1.default({ store: new redis_1.default(redisUrl) })],
                        ttl: 300_000,
                    };
                },
            }),
            bull_1.BullModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const rawUrl = config.get('BULL_REDIS_URL', 'redis://localhost:6379');
                    const redisUrl = new URL(rawUrl);
                    return {
                        redis: {
                            host: redisUrl.hostname,
                            port: Number(redisUrl.port) || 6379,
                            password: redisUrl.password || undefined,
                        },
                    };
                },
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            providers_module_1.ProvidersModule,
            search_module_1.SearchModule,
            orders_module_1.OrdersModule,
            payments_module_1.PaymentsModule,
            reviews_module_1.ReviewsModule,
            subscriptions_module_1.SubscriptionsModule,
            notifications_module_1.NotificationsModule,
            ai_client_module_1.AiClientModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map