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
 * Prisma 7 uses the "client" engine and requires a driver adapter — there is
 * no bundled binary engine anymore.  We use @prisma/adapter-pg which wraps the
 * `pg` Pool under the hood.  The connection string is read at runtime from
 * ConfigService so every environment (dev / test / prod) picks up its own URL.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    const connectionString = config.getOrThrow<string>('DATABASE_URL');
    const adapter = new PrismaPg(connectionString);
    // `as any` is required because NestJS DI calls super() before TypeScript
    // can resolve the generic — the adapter option is fully valid at runtime.
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('PostgreSQL connected via @prisma/adapter-pg');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
