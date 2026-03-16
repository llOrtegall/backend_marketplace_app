# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev          # Start development server with hot reload
bun run test         # Run all tests (parallel unit/application + serial e2e)
bun run test:dots    # Run all tests with dots reporter
bun run test:unit    # Run unit/application suites in parallel by domain
bun run test:e2e     # Run end-to-end tests serially
bun test --watch     # Run tests in watch mode
bun test --coverage  # Run tests with coverage report
bun run lint         # Lint and auto-fix with Biome
bun run format       # Format code with Biome
```

Run a single test file:
```bash
bun test src/test/path/to/file.test.ts --env-file .env.test
```

Git hooks are managed by `simple-git-hooks` and run `lint-staged` + `bun run test` on pre-commit and `bun run test` on pre-push.

## Architecture

This is a **Clean Architecture** backend with four layers. Dependencies flow inward — outer layers depend on inner ones, never the reverse.

```
domain → application → infrastructure
                    ↘ presentation
```

| Layer | Path | Responsibility |
|---|---|---|
| Domain | `src/domain/` | Entities, value objects, repository interfaces — pure business logic, no frameworks |
| Application | `src/application/` | Use cases (one class per use case), DTOs, factory functions for DI |
| Infrastructure | `src/infrastructure/` | MongoDB repository implementations, Mongoose schemas, transaction manager |
| Presentation | `src/presentation/` | Express controllers, routes, Zod request validation |
| Shared | `src/shared/` | Custom errors, middleware, API response types, JWT/password utils |

## Key Patterns

**Entities** have two static constructors: `create()` for new objects (validates/generates IDs) and `reconstitute()` for rebuilding from persistence (trusts the data).

**Value Objects** (e.g., `Money`, `Email`, `OrderItem`) are immutable and live in `src/domain/*/value-objects/`.

**Use Cases** receive their dependencies injected via factory functions (`*.factory.ts`) — this is how repositories and services are wired together without a DI container.

**Repository interfaces** are defined in the domain layer; concrete MongoDB implementations are in infrastructure. Never import infrastructure from domain or application.

**Request validation** uses Zod schemas in the presentation layer (`src/presentation/*/schemas/`). Environment variables are validated with Zod in `src/config/env.ts`.

**Error handling** uses a custom hierarchy extending `AppError`. Throw typed errors (e.g., `NotFoundError`, `UnauthorizedError`) from any layer — the global error handler in `src/shared/middleware/errorHandler.ts` maps them to HTTP responses.

## Tech Stack

- **Runtime**: Bun (not Node.js — use `bun` for all commands)
- **Web**: Express 5
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (access + refresh tokens)
- **Payments**: Wompi (Colombian payment gateway) — webhook signature verified via `verifyWompiWebhook` middleware
- **Validation**: Zod 4
- **Linter/Formatter**: Biome (single quotes, organized imports disabled)

## Environment Variables

See `src/config/env.ts` for all required variables. Key ones:
- `MONGODB_URI`, `PORT` (default 4000)
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET`
- `NODE_ENV` — set to `test` for test runs
