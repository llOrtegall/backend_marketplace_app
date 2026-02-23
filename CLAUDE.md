# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack e-commerce marketplace app with:
- **Backend**: Bun + Express 5 + TypeScript + Sequelize (PostgreSQL)
- **Frontend**: React 19 + Vite + TailwindCSS v4 + React Router v7
- **Auth**: `better-auth` (email/password + Google OAuth)
- **Storage**: Cloudflare R2 (S3-compatible) for product images
- **Payments**: Wompi (payment gateway integration, currently commented out)
- **Deployment**: Docker Compose with Nginx reverse proxy

## Development Commands

### Backend (`backend/`)
```bash
bun run dev      # Watch mode with hot reload
bun run start    # Production start
```

### Frontend (`frontend/`)
```bash
bun run dev      # Vite dev server
bun run build    # tsc -b && vite build
bun run lint     # ESLint
bun run preview  # Preview production build
```

### Docker (production)
```bash
docker compose up -d
```
The `ortega` Docker network must exist externally (`docker network create ortega`).

## Architecture

### Backend Structure
```
backend/src/
├── server.ts           # Express app entry point; mounts auth + API routes
├── config/
│   ├── database.ts     # Sequelize instance (PostgreSQL via DATABASE_URL)
│   └── init.ts         # Syncs Sequelize models on startup
├── lib/
│   ├── auth.ts         # better-auth configuration (email/pw + Google)
│   └── r2.ts           # Cloudflare R2 upload/signed URL helpers
├── middleware/
│   ├── auth.middleware.ts   # requireAuth, requireRole, requireAdmin
│   └── upload.middleware.ts # multer memory storage (5MB limit, images only)
├── models/             # Sequelize models: Product, Image, Order
├── controllers/        # Thin request handlers; delegate to services
├── services/
│   ├── products.service.ts  # Singleton pattern (ProductsService.getInstance())
│   └── repository/Product.ts # ProductRepository interface
├── routes/             # Express Router; /api/v1/products active, /api/v1/payments commented out
├── schema/
│   ├── envSchema.ts    # Zod env validation; fails fast on startup if vars missing
│   └── validateProduct.ts   # Zod product input schema
└── errors/
    └── service.error.ts     # ServiceError(statusCode, message)
```

**Request flow**: `server.ts` → auth handler (`/api/auth/*`) or `apiRouter` (`/api/v1/*`) → route → middleware (auth + upload) → controller → service → Sequelize model

**Two DB schemas are used**: `DATABASE_SCHEMA` for better-auth tables, `DATABASE_STORE_SCHEMA` for Sequelize product/image/order tables.

**Services use the Singleton pattern** — always use `ProductsService.getInstance()`, never `new ProductsService()`.

### Frontend Structure
```
frontend/src/
├── main.tsx            # React root; wraps app in CartProvider
├── lib/auth-client.ts  # better-auth React client; exports signIn, signOut, signUp, useSession
├── contexts/
│   └── CartContext.tsx # Cart state backed by localStorage (key: react_marketplace_cart_v1)
├── routes/
│   ├── index.tsx       # createBrowserRouter; lazy-loads pages
│   ├── Layout.tsx      # Shared layout (Header, Toaster)
│   └── AdminRouteGuard.tsx  # Role-based route protection
└── pages/
    ├── Home.tsx        # Product listing
    ├── Login.tsx / Register.tsx
    ├── CheckOut.tsx
    └── admin/          # Admin panel (product management)
```

**Path alias**: `@/` maps to `frontend/src/` (configured in `vite.config.ts`).

**Auth client** reads `VITE_AUTH_BASE_URL` env var; defaults to `http://localhost:5000`. If the value starts with `/`, it is treated as a path relative to `window.location.origin` (for Nginx proxying).

### Nginx (production)
Serves the built frontend from `/usr/share/nginx/html`, proxies `/api/v1/` and `/api/auth/` to the backend container `api_marktplace_v1:3000`.

## Environment Variables

Copy `backend/.env.example` to `backend/.env`. Required backend vars:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `DATABASE_SCHEMA` | Schema for better-auth tables |
| `DATABASE_STORE_SCHEMA` | Schema for Sequelize models |
| `BETTER_AUTH_SECRET` | better-auth session secret |
| `BETTER_AUTH_URL` | Backend base URL |
| `FRONTEND_ORIGIN` | Frontend origin for CORS/redirects |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | Cloudflare R2 |
| `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET` | Wompi payments |

Frontend uses `VITE_AUTH_BASE_URL` (set in `frontend/.env`).

## Key Patterns & Notes

- **Product images**: Uploaded via multer to memory, then pushed to Cloudflare R2. The `image` field on the `Product` model stores the R2 object key, not a full URL. Use `getProductImageSignedUrl(key)` (10-minute expiry) to generate URLs.
- **Auth roles**: `customer` (default) and `admin`. Route protection uses `requireAuth` → `requireAdmin` middleware chain.
- **Error handling in controllers**: Catch `BaseError` from Sequelize for DB errors; throw `ServiceError` from services for business logic errors.
- **Payments route** (`/api/v1/payments`) is currently commented out in `routes/index.ts`.
- **Cart state** is client-side only (localStorage), not persisted to the backend.
- **`value` vs `price`** on `Product`: both are `DECIMAL(10,2)` — `value` appears to represent cost/wholesale price; `price` is the selling price.
