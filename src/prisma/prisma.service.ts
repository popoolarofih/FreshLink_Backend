import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * PrismaService
 *
 * Prisma 7 uses the "client" engine type which requires a driver adapter.
 * We use @prisma/adapter-pg (the official PostgreSQL adapter backed by `pg`).
 * The DATABASE_URL is read at runtime from ConfigService so it picks up the
 * .env value correctly in all environments.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    const connectionString = config.get<string>('DATABASE_URL')!;
    const adapter = new PrismaPg({ connectionString });
    super({ adapter } as any);
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to PostgreSQL via Prisma (adapter-pg)');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
