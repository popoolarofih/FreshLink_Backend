# FreshLink Backend

AI-powered two-sided marketplace connecting food/beverage buyers (individuals, restaurants, hotels, corporate offices) with providers (farmers, personal chefs, bakers, caterers, meal-prep services, bartenders).

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | NestJS + TypeScript |
| Database | PostgreSQL + Prisma ORM (v7) |
| Cache / Sessions | Redis (ioredis / @keyv/redis) |
| Background jobs | BullMQ |
| Auth | JWT – access + refresh token rotation |
| Validation | class-validator + class-transformer |
| Docs | Swagger / OpenAPI (auto-generated) |
| Payments | Stripe (escrow-shaped); Flutterwave stub |
| AI / LLM | Groq SDK → Llama 3.1 8B (fast) + Llama 3.3 70B (reasoning) |

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

- API base: `http://localhost:3001/api/v1`
- Swagger docs: `http://localhost:3001/api/docs`

---

## Environment Variables

Copy `.env.example` → `.env`. Variables marked **REQUIRED TO BOOT** will cause startup failure if missing or clearly invalid.

### Server

| Variable | Required | Example | Notes |
|---|---|---|---|
| `PORT` | Optional | `3001` | HTTP port |
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

### Groq LLM Integration

| Variable | Required | Example | Notes |
|---|---|---|---|
| `GROQ_API_KEY` | **REQUIRED** for AI features | `gsk_...` | Get from [console.groq.com](https://console.groq.com). **Never commit.** If absent, all AI services fall back to rule-based logic automatically. |
| `GROQ_MODEL_FAST` | Optional | `llama-3.1-8b-instant` | Fast/small model for latency-sensitive paths (search parsing). Swappable without redeployment. |
| `GROQ_MODEL_REASONING` | Optional | `llama-3.3-70b-versatile` | Reasoning model for quality-critical paths (contracts, pricing rationale, matchmaking). |
| `GROQ_TIMEOUT_MS` | Optional | `10000` | AbortController timeout per Groq call in ms. |
| `GROQ_MAX_RETRIES` | Optional | `3` | Retry attempts with exponential backoff before falling back to rule-based logic. |

> **Removed variables** (delete from your `.env`):
> `AI_SERVICE_URL`, `AI_SERVICE_API_KEY`, `AI_SERVICE_TIMEOUT_MS`
> The external AI microservice no longer exists — Groq is called in-process with no HTTP hop.

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
│   ├── matchmaking/    Deterministic score + Groq re-rank + "why this match" reasons
│   └── search-parsing/ NL query → structured filters (fast Llama model)
├── orders/             Order lifecycle state machine, counter-offers, contract drafts
│   └── contracts/      Category-specific Groq contract generation + platform-norm flags
├── pricing/            Statistical baseline + Groq seasonality adjustment (±30% clamp)
├── payments/           Stripe escrow (hold → release / refund)
├── reviews/            One review per completed order, denormalised ratings
├── subscriptions/      Plan management + BullMQ cron for expiry/reminders
├── notifications/      DB-persisted notifications + BullMQ delivery queue
├── groq-client/        GroqClientService – single SDK wrapper, retry/backoff/logging
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

## Groq LLM Architecture

All AI features run **in-process** — no external microservice, no HTTP hop. The
`groq-client` module wraps the `groq-sdk` and is the single chokepoint for all
Groq traffic:

```
GroqClientService  (groq-client/)
  ├── retry loop (exponential backoff, GROQ_MAX_RETRIES)
  ├── AbortController timeout (GROQ_TIMEOUT_MS)
  ├── structured JSON log per call (model, latencyMs, token counts)
  └── ping() → used by GET /health for reachability check

Consumers:
  SearchParsingService  → fast model  (NL query → structured filters)
  MatchmakingService    → fast model  (deterministic score + AI re-rank)
  PricingService        → reasoning   (stats baseline + seasonality rationale)
  ContractsService      → reasoning   (category-specific sections + flag pass)
```

### Graceful Degradation

Every consumer catches `GroqUnavailableException` and falls back automatically:

| Service | Fallback behaviour |
|---|---|
| `SearchParsingService` | Returns `{ confidence: 0, rawQuery }` — keyword search still runs |
| `MatchmakingService` | Returns deterministic weighted scores, logs `aiFallback: true` |
| `PricingService` | Returns statistical median/IQR range only, logs `aiFallback: true` |
| `ContractsService` | Returns minimal sectioned template, logs `aiFallback: true` |

### Prompt Templates

All prompt text lives under `prompts/` at the project root — never inlined in
service code. Category-specific contract prompts are in `prompts/contracts/`.
Swap a prompt without touching TypeScript.

### Health Check

`GET /api/v1/health` now returns:
```json
{
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "groq": { "reachable": true, "model": "llama-3.1-8b-instant", "latencyMs": 412 }
}
```

`status` stays `"ok"` even when `groq.reachable` is `false` — the app runs in
degraded (rule-based) mode without Groq.

---

## Extending the Project

- **Swap payment provider**: implement `IPaymentProvider` in `src/payments/payment-provider.interface.ts`, then replace `StripeProvider` in `payments.module.ts`.
- **Real email delivery**: replace the `console.log` stub in `notifications.processor.ts` with your provider (Resend, Postmark, Nodemailer).
- **Real push/SMS**: same processor — add FCM / Twilio calls.
- **Swap LLM**: update `GROQ_MODEL_FAST` / `GROQ_MODEL_REASONING` env vars to any model available on Groq. No code change required.
- **Custom prompt tuning**: edit files under `prompts/` — no TypeScript changes needed.
