# Getting Started

## Prerequisites

- [Bun](https://bun.sh) >= 1.0 (runtime and package manager — **not Node.js**)
- MongoDB instance (local or Atlas)
- Wompi account (sandbox keys are enough for development)

---

## Installation

```bash
bun install
```

---

## Environment Variables

Copy the template below to a `.env` file in the project root:

```env
# Server
PORT=4000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/marketplace

# JWT
JWT_SECRET=your_jwt_secret_min_16_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_16_chars

# CORS (comma-separated origins or * for all)
CORS_ORIGINS=*

# Wompi Payment Gateway
WOMPI_PUBLIC_KEY=pub_test_...
WOMPI_PRIVATE_KEY=prv_test_...
WOMPI_INTEGRITY_SECRET=your_integrity_secret
WOMPI_EVENTS_SECRET=your_events_secret
WOMPI_BASE_URL=https://sandbox.wompi.co/v1
```

> All variables are validated at startup via Zod (`src/config/env.ts`). The server will not boot if any required variable is missing or invalid.

---

## Running in Development

```bash
bun run dev
```

The server starts on `http://localhost:4000` with hot reload enabled. You will see request logs in the console (via Morgan).

---

## Running Tests

Tests use a separate `.env.test` file and an in-memory MongoDB instance — no external database needed.

```bash
# Run all tests
bun run test

# Run unit/application suites in parallel by domain
bun run test:unit

# Run end-to-end suite serially
bun run test:e2e

# Run full suite with dots reporter
bun run test:dots

# Watch unit/application suites
bun run test:watch:unit

# Watch end-to-end suite
bun run test:watch:e2e

# Watch mode (re-runs on file changes)
bun test --watch

# Coverage report
bun test --coverage

# Single test file
bun test src/test/e2e/orders.e2e.test.ts --env-file .env.test
```

> Git hooks are managed by `simple-git-hooks` and automatically run `lint-staged + bun run test` on pre-commit and `bun run test` on pre-push.

---

## Linting and Formatting

```bash
bun run lint      # Lint and auto-fix with Biome
bun run format    # Format code with Biome
```

---

## Health Check

Once running, verify the server is up:

```
GET http://localhost:4000/
```

Expected response: `200 OK`
