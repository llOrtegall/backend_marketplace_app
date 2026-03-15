# Architecture & Design Decisions

## Overview

This backend follows **Clean Architecture** principles. The core idea is that business logic is independent of frameworks, databases, and delivery mechanisms. Dependencies always point inward — outer layers depend on inner ones, never the reverse.

```
domain → application → infrastructure
                    ↘ presentation
```

---

## Layer Breakdown

### Domain (`src/domain/`)

The innermost layer. Contains pure business logic with zero external dependencies.

- **Entities**: `User`, `Product`, `Order`, `Payment` — aggregate roots that enforce invariants
- **Value Objects**: `Money`, `Price`, `Stock`, `Quantity`, `Email`, `OrderItem` — immutable objects that represent concepts with no identity
- **Repository Interfaces**: `IUserRepository`, `IProductRepository`, etc. — contracts the infrastructure layer must fulfill

Nothing in this layer imports from Express, Mongoose, or any other framework.

### Application (`src/application/`)

Orchestrates use cases. One class per use case.

- **Use Cases**: Each use case receives its dependencies (repositories, services) via constructor injection.
- **Factory Functions** (`*.factory.ts`): Wire up dependencies and return ready-to-use use case instances. This is the DI wiring point — no container needed.
- **DTOs**: Define the shape of data flowing in and out of use cases.

20 use cases total, grouped by domain: `user` (8), `product` (5), `order` (4), `payment` (3).

### Infrastructure (`src/infrastructure/`)

Adapts external systems to domain interfaces.

- **MongoDB Repositories**: Concrete implementations of repository interfaces using Mongoose.
- **Mongoose Schemas** (`*.Schema.ts`): ODM schemas that map domain entities to MongoDB documents.
- **Transaction Manager**: Wraps MongoDB sessions for operations that span multiple collections.

### Presentation (`src/presentation/`)

The HTTP delivery mechanism.

- **Controllers**: Call use cases and map results to HTTP responses.
- **Routes**: Define Express routes, apply middleware, wire controllers.
- **Zod Schemas**: Validate and parse incoming request body/query/params before they reach the controller.

### Shared (`src/shared/`)

Cross-cutting concerns available to all layers.

- **Error Hierarchy**: `AppError` base class with typed subclasses (`NotFoundError`, `ForbiddenError`, `UnauthorizedError`, `ValidationError`, `UnprocessableError`).
- **Error Handler Middleware**: Maps error types to HTTP status codes. All unhandled errors are caught here.
- **JWT Utils**: Access and refresh token generation and verification.
- **Password Utils**: Argon2 hashing and comparison.
- **Middleware**: `authenticate`, `optionalAuthenticate`, `authorize`, `validate`, rate limiters.

---

## Key Patterns

### Entity Static Constructors

Every entity has two static factory methods:

```typescript
// For creating a NEW entity — validates input, generates UUID, sets timestamps
static create(input: CreateUserInput): User

// For REBUILDING from persistence — trusts the data, no validation
static reconstitute(props: UserProps): User
```

This separation avoids polluting the persistence path with creation-time validation.

### Value Objects

Value objects are immutable and validated at construction time. Examples:

- `Money` — wraps an amount in COP cents, ensures non-negative
- `Price` — positive number rounded to 2 decimal places
- `Stock` — non-negative integer
- `Email` — lowercased, validated format
- `OrderItem` — product snapshot + quantity + computed subtotal

They throw domain errors if given invalid data, keeping invariants close to the data.

### Repository Pattern

Domain layer defines interfaces (contracts). Infrastructure implements them. Use cases only depend on the interface — they never import a Mongoose model directly.

```
IProductRepository (domain)
    ↑ implements
MongoProductRepository (infrastructure)
```

This makes use cases testable in isolation and the persistence layer swappable.

### Dependency Injection via Factory Functions

There is no DI container. Each use case gets its dependencies injected through a factory:

```typescript
// src/application/product/createProduct.factory.ts
export function makeCreateProductUseCase() {
  const repo = new MongoProductRepository()
  return new CreateProductUseCase(repo)
}
```

Routes call the factory once and pass the instance to the controller. Simple, explicit, and easy to trace.

### Role Hierarchy

```
superadmin (3) > admin (2) > user (1)
```

Authorization follows a privilege model — higher roles can manage lower ones. The `isPrivilegedRole` utility captures this. Superadmin is the only role that can promote users to admin.

### Soft Deletes

Products are never hard-deleted. A `status: 'deleted'` flag and `deletedAt` timestamp are set instead. This preserves historical order data that references the product. Deleted products are filtered out of all public queries.

### Pagination

List endpoints support both **offset pagination** (page + limit) and **cursor-based pagination** (cursor param). Cursor pagination is preferred for large datasets.

---

## Payment Flow

```
Client                  API Server               Wompi
  │                         │                       │
  │  POST /payments/initiate│                       │
  ├────────────────────────►│                       │
  │                         │  POST /transactions   │
  │                         ├──────────────────────►│
  │                         │◄──────────────────────┤
  │                         │  wompiTransactionId   │
  │◄────────────────────────┤  redirectUrl          │
  │  Payment record created │                       │
  │  Order → AWAITING_PAYMENT                       │
  │                         │                       │
  │  (user completes payment on Wompi UI)           │
  │                         │                       │
  │                         │◄── POST /webhook ─────┤
  │                         │    transaction.event  │
  │                         │                       │
  │                         │  UpdatePayment        │
  │                         │  UpdateOrder          │
  │                         │  (CONFIRMED or CANCELLED)
```

Webhook signatures are verified using `WOMPI_EVENTS_SECRET` before any processing occurs.

---

## Error Handling

Errors are thrown from any layer using typed classes:

```typescript
throw new NotFoundError('Product not found')
throw new ForbiddenError('Cannot manage users of equal or higher role')
throw new UnprocessableError('ORDER_INVALID_TRANSITION', 'Cannot cancel a confirmed order')
```

The global error handler middleware (`src/shared/middleware/errorHandler.ts`) catches everything and maps it to the correct HTTP response. No try/catch clutter in controllers.

---

## Security

- **Rate limiting**: Auth endpoints (`/auth/register`, `/auth/login`) are rate-limited to prevent brute force.
- **Helmet**: Sets security-related HTTP headers on every response.
- **JWT secrets**: Minimum 16 characters, validated at startup.
- **Wompi webhook verification**: Checksum validation before processing any payment event.
- **Password hashing**: Argon2 (via Bun built-in).
- **CORS**: Configurable via `CORS_ORIGINS` environment variable.
