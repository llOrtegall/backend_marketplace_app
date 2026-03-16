# Tech Stack

## Runtime

| Tool | Version | Role |
|------|---------|------|
| [Bun](https://bun.sh) | >= 1.0 | Runtime, package manager, test runner, bundler |

Bun replaces Node.js entirely. All commands use `bun` instead of `node` or `npm`. Built-in support for TypeScript, `.env` files, testing, and password hashing (Argon2).

---

## Web Framework

| Tool | Version | Role |
|------|---------|------|
| [Express](https://expressjs.com) | ^5.2 | HTTP server and routing |

Express 5 is used for its stability and simplicity. Route handlers are thin — they validate input, call a use case, and return a response.

---

## Database

| Tool | Version | Role |
|------|---------|------|
| [MongoDB](https://www.mongodb.com) | — | Document database |
| [Mongoose](https://mongoosejs.com) | ^9.3 | ODM — schema definition, querying, transactions |

MongoDB is used for its flexible document model. Mongoose provides schema validation at the infrastructure layer and supports multi-document transactions via sessions.

---

## Auth

| Tool | Version | Role |
|------|---------|------|
| [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) | ^9.0 | JWT access and refresh token generation/verification |
| Bun built-in (`Bun.password`) | — | Argon2 password hashing and comparison |

Two-token strategy: short-lived **access tokens** (in Authorization header) and longer-lived **refresh tokens** (stored client-side). Refresh tokens are stored in the database and can be invalidated on logout.

---

## Payments

| Service | Role |
|---------|------|
| [Wompi](https://wompi.co) | Colombian payment gateway |

Wompi handles card payments, PSE, Nequi, Bancolombia, and Daviplata. The integration flow:
1. Client requests an acceptance token from Wompi directly.
2. Server creates a transaction via Wompi's REST API.
3. Wompi sends webhook events as the transaction progresses.
4. Server verifies webhook signatures and updates order/payment status.

---

## Validation

| Tool | Version | Role |
|------|---------|------|
| [Zod](https://zod.dev) | ^4.3 | Schema validation for request bodies, queries, and environment variables |

Zod schemas live in `src/presentation/*/schemas/` and `src/config/env.ts`. The `validate` middleware runs Zod schemas before requests reach controllers.

---

## Security & HTTP

| Tool | Version | Role |
|------|---------|------|
| [Helmet](https://helmetjs.github.io) | ^8.1 | Sets security HTTP headers (CSP, HSTS, etc.) |
| [cors](https://github.com/expressjs/cors) | ^2.8 | Cross-Origin Resource Sharing, configurable via `CORS_ORIGINS` |
| [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) | ^8.3 | Rate limiting for auth endpoints |

---

## Linting & Formatting

| Tool | Version | Role |
|------|---------|------|
| [Biome](https://biomejs.dev) | 2.4.7 | Linting and formatting (replaces ESLint + Prettier) |

Configured for single quotes. Biome runs via `bun run lint` and `bun run format`. Also runs automatically via `lint-staged` on pre-commit.

---

## Testing

| Tool | Version | Role |
|------|---------|------|
| Bun test runner | built-in | Test execution with Jest-compatible API |
| [Supertest](https://github.com/ladjs/supertest) | ^7.2 | HTTP-level integration tests against the Express app |
| [mongodb-memory-server](https://github.com/nodkz/mongodb-memory-server) | ^11.0 | In-memory MongoDB instance — no external DB needed for tests |

Tests are end-to-end at the HTTP layer, hitting real use cases and a real (in-memory) database. This approach catches integration issues that mocked tests miss.

---

## Developer Experience

| Tool | Role |
|------|------|
| [Morgan](https://github.com/expressjs/morgan) | HTTP request logging in development |
| [simple-git-hooks](https://github.com/toplenboren/simple-git-hooks) | Git hooks — runs `lint-staged + bun run test` on pre-commit and `bun run test` on pre-push |
| lint-staged | Runs Biome only on staged files for fast pre-commit checks |
| TypeScript | Strict types across the entire codebase |
