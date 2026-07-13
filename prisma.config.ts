import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// prisma.config.ts is used by the Prisma CLI (migrate, generate, etc.)
// The adapter is configured at runtime inside PrismaService.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
