import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import Keyv from 'keyv';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProvidersModule } from './providers/providers.module';
import { SearchModule } from './search/search.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GroqClientModule } from './groq-client/groq-client.module';
import { MessagesModule } from './messages/messages.module';
import { FavoritesModule } from './favorites/favorites.module';
import { BuyersModule } from './buyers/buyers.module';

@Module({
  imports: [
    // ── Config (global) ──────────────────────────────────────────────────
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    // ── Rate limiting ────────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60000),
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // ── Redis-backed cache (cache-manager v7 + @keyv/redis) ──────────────
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>(
          'REDIS_URL',
          'redis://localhost:6379',
        );
        return {
          stores: [new Keyv({ store: new KeyvRedis(redisUrl) })],
          ttl: 300_000, // default 5-min TTL in ms
        };
      },
    }),

    // ── BullMQ (queues) ──────────────────────────────────────────────────
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const rawUrl = config.get<string>(
          'BULL_REDIS_URL',
          'redis://localhost:6379',
        );
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

    // ── Feature modules ──────────────────────────────────────────────────
    PrismaModule,
    AuthModule,
    UsersModule,
    ProvidersModule,
    SearchModule,
    OrdersModule,
    PaymentsModule,
    ReviewsModule,
    SubscriptionsModule,
    NotificationsModule,
    GroqClientModule,
    MessagesModule,
    FavoritesModule,
    BuyersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
