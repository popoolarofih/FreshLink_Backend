# FreshLink Backend

AI-powered two-sided marketplace connecting food/beverage buyers (individuals, restaurants, hotels, corporate offices) with providers (farmers, personal chefs, bakers, caterers, meal-prep services, bartenders).

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | NestJS + TypeScript |
| Database | PostgreSQL + Prisma ORM (v7) |
| Cache / Sessions | Redis (ioredis) |
| Background jobs | BullMQ |
| Auth | JWT – access + refresh token rotation |
| Validation | class-validator + class-transformer |
| Docs | Swagger / OpenAPI (auto-generated) |
| Payments | Stripe (escrow-shaped); Flutterwave stub |

---

## Prerequisites

- Node.js ≥ 18
- PostgreSQL running locally (default: `localhost:5432`)
- Redis running locally (default: `localhost:6379`)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/freshlink?schema=public
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=<random 32+ char string>
JWT_REFRESH_SECRET=<random 32+ char string>
```

See the full variable reference below.

### 3. Create the database

```bash
# Create the DB (run once, or use psql/pgAdmin)
psql -U postgres -c "CREATE DATABASE freshlink;"
```

### 4. Run migrations

```bash
npm run db:migrate
# Enter a migration name when prompted, e.g. "init"
```

### 5. Generate Prisma Client

```bash
npm run db:generate
```

### 6. Seed with test data

```bash
npm run seed
```

This creates 3 buyers and 6 providers across all categories with availability slots, pricing, and portfolio items. All seed accounts use password `Password1!`.

### 7. Start the server

```bash
npm run start:dev
```

- API base: `http://localhost:3000/api/v1`
- Swagger docs: `http://localhost:3000/api/docs`

---

## Environment Variables

Copy `.env.example` → `.env`. Variables marked **REQUIRED TO BOOT** will cause startup failure if missing or clearly invalid.

### Server

| Variable | Required | Example | Notes |
|---|---|---|---|
| `PORT` | Optional | `3000` | HTTP port |
| `NODE_ENV` | Optional | `development` | `development` \| `production` \| `test` |

### Database

| Variable | Required | Example | Notes |
|---|---|---|---|
| `DATABASE_URL` | **REQUIRED** | `postgresql://postgres:secret@localhost:5432/freshlink?schema=public` | Full Prisma connection URL. Include `?schema=public` for the default schema. |

### Redis

| Variable | Required | Example | Notes |
|---|---|---|---|
| `REDIS_URL` | **REQUIRED** | `redis://localhost:6379` | Main Redis instance — used for cache and BullMQ. |
| `BULL_REDIS_URL` | Optional | `redis://localhost:6379` | Separate Redis URL for BullMQ queues. Falls back to `REDIS_URL`. |

### JWT

| Variable | Required | Example | Notes |
|---|---|---|---|
| `JWT_ACCESS_SECRET` | **REQUIRED** | `openssl rand -hex 64` | Min 32 chars in production. |
| `JWT_ACCESS_EXPIRY` | Optional | `15m` | Supports `s`, `m`, `h`, `d`. |
| `JWT_REFRESH_SECRET` | **REQUIRED** | `openssl rand -hex 64` | Must differ from access secret. |
| `JWT_REFRESH_EXPIRY` | Optional | `7d` | |

### Stripe

| Variable | Required | Example | Notes |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | Required for payments | `sk_test_xxx` | Use test keys (`sk_test_...`) for local dev. |
| `STRIPE_WEBHOOK_SECRET` | Required for webhooks | `whsec_xxx` | From Stripe Dashboard → Webhooks. |

### Flutterwave (TODO)

| Variable | Required | Example | Notes |
|---|---|---|---|
| `FLUTTERWAVE_SECRET_KEY` | Not used yet | `FLWSECK_TEST-xxx` | Leave as dummy. The `FlutterwaveProvider` class is stubbed — wire it up when ready. |

### AI Microservice

| Variable | Required | Example | Notes |
|---|---|---|---|
| `AI_SERVICE_URL` | Optional | `http://localhost:4000` | Base URL of the AI service. Falls back to rule-based logic if unreachable. |
| `AI_SERVICE_API_KEY` | Optional | any string | Sent as `x-api-key` header on all AI calls. |
| `AI_SERVICE_TIMEOUT_MS` | Optional | `5000` | Milliseconds before the HTTP call is abandoned. |

### Email (stub)

| Variable | Required | Example | Notes |
|---|---|---|---|
| `MAIL_FROM` | Optional | `noreply@freshlink.app` | Used in email stubs (console.log only for now). |
| `APP_BASE_URL` | Optional | `http://localhost:3000` | Used in verification link construction. |

### Rate limiting

| Variable | Required | Example | Notes |
|---|---|---|---|
| `THROTTLE_TTL` | Optional | `60000` | Window in ms. |
| `THROTTLE_LIMIT` | Optional | `100` | Max requests per window per IP. |

---

## Module Overview

```
src/
├── auth/               JWT registration, login, refresh, email verification
├── users/              User profile management, admin user list
├── providers/          Provider profiles, portfolio, pricing, availability
├── search/             Filterable provider search with AI ranking
├── orders/             Order lifecycle state machine, counter-offers, contract drafts
├── payments/           Stripe escrow (hold → release / refund)
├── reviews/            One review per completed order, denormalized ratings
├── subscriptions/      Plan management + BullMQ cron for expiry/reminders
├── notifications/      DB-persisted notifications + BullMQ delivery queue
├── ai-client/          AiServiceClient – typed HTTP wrapper with graceful fallbacks
└── prisma/             PrismaService (global)
```

### Order State Machine

```
REQUESTED → CONFIRMED → CONTRACT_SIGNED → IN_PROGRESS → DELIVERED → REVIEWED
     ↘           ↘             ↘
   CANCELLED   CANCELLED    CANCELLED
```

Only valid transitions are accepted; attempting an invalid one returns `400 Bad Request`.

### Payment Flow (Escrow)

```
PENDING  →  HELD  →  RELEASED
                 ↘
               REFUNDED
```

Funds are captured (released) only after the buyer explicitly confirms delivery. Stripe's `capture_method: manual` holds the authorisation until then.

### AI Service Integration Points

`AiClientService` exposes four typed methods. All fall back gracefully if the AI service is unreachable:

| Method | Fallback |
|---|---|
| `rankProviders(buyerContext, candidates)` | Sort by `averageRating` descending |
| `suggestPrice(serviceContext)` | Static `50 000 – 500 000 NGN` range |
| `generateContract(orderContext)` | Minimal plaintext template |
| `parseSearchQuery(rawQuery)` | Empty filter object (returns all results) |

---

## Useful Commands

```bash
npm run db:migrate       # Create and apply a new migration
npm run db:push          # Push schema changes without migration history (dev only)
npm run db:studio        # Open Prisma Studio (GUI)
npm run seed             # Seed test data
npm run start:dev        # Start with hot-reload
npm run build            # Production build
npm run start:prod       # Run production build
```

---

## Extending the Project

- **Swap payment provider**: implement `IPaymentProvider` in `src/payments/payment-provider.interface.ts`, then replace `StripeProvider` in `payments.module.ts`.
- **Real email delivery**: replace the `console.log` stub in `notifications.processor.ts` with your provider (Resend, Postmark, Nodemailer).
- **Real push/SMS**: same processor — add FCM / Twilio calls.
- **AI service**: any HTTP service that implements the four routes (`/rank-providers`, `/suggest-price`, `/generate-contract`, `/parse-search`) with the expected request/response shapes in `ai-client.types.ts`.
