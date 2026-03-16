# API Reference

## Base URL

```
http://localhost:4000
```

## Authentication

The API uses **JWT Bearer tokens**. Include the access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Access tokens are short-lived. Use the refresh token endpoint to obtain a new one.

If a user is marked as `inactive` or `banned`, login, refresh, and authenticated operations are blocked.

## Response Format

All successful responses follow this envelope:

```json
{ "success": true, "data": { ... } }
```

Error responses:

```json
{ "success": false, "error": { "message": "...", "code": "ERROR_CODE" } }
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content (logout) |
| 400 | Validation error |
| 401 | Unauthenticated |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (e.g., email taken) |
| 422 | Unprocessable (business rule violation) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Auth

### POST /auth/register

Register a new user account.

**Rate limited.**

**Body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password1"
}
```

| Field | Rules |
|-------|-------|
| name | 2–80 characters |
| email | Valid email |
| password | 8–72 chars, min 1 uppercase, min 1 number |

**Response `201`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user",
    "status": "active",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### POST /auth/login

Authenticate and receive tokens.

**Rate limited.**

**Body:**

```json
{
  "email": "jane@example.com",
  "password": "Password1"
}
```

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### POST /auth/refresh

Exchange a refresh token for a new access token.

**Body:**

```json
{
  "refreshToken": "eyJ..."
}
```

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ..."
  }
}
```

---

### POST /auth/logout

**Auth required.**

Invalidate the current refresh token.

**Body:**

```json
{
  "refreshToken": "eyJ..."
}
```

**Response `204`** (no body).

---

## Users

### GET /users/:id

**Auth required.**

Get a user profile. Regular users can only fetch their own profile. Admins and superadmins can fetch any.

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user",
    "status": "active",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### GET /users

**Auth required. Role: `admin` or `superadmin`.**

List all users with optional filters.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| role | `superadmin` \| `admin` \| `user` | Filter by role |
| status | `active` \| `inactive` \| `banned` | Filter by status |
| search | string | Search by name or email |
| page | number (default 1) | Page number |
| limit | number (default 20, max 100) | Items per page |

---

### PATCH /users/:id/status

**Auth required. Role: `admin` or `superadmin`.**

Update a user's account status.

**Body:**

```json
{
  "status": "banned"
}
```

Allowed values: `active`, `inactive`, `banned`.

---

### POST /users/:id/promote

**Auth required. Role: `superadmin` only.**

Promote a user to the `admin` role.

No body required.

---

## Products

### GET /products

Public (auth optional). Returns active products for unauthenticated users.

Only `admin` and `superadmin` can list inactive products.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| category | string | Filter by category |
| sellerId | string | Filter by seller |
| minPrice | number | Minimum price |
| maxPrice | number | Maximum price |
| status | `active` \| `inactive` | Filter by status |
| page | number (default 1) | Page number |
| limit | number (default 20, max 100) | Items per page |
| sortBy | `price` \| `createdAt` (default `createdAt`) | Sort field |
| order | `asc` \| `desc` (default `desc`) | Sort direction |
| cursor | string | Cursor for pagination |

---

### GET /products/:id

Public (auth optional). Returns the product if it exists and is not deleted.

Inactive products are only visible to `admin` and `superadmin`.

---

### POST /products

**Auth required. Role: `admin` or `superadmin`.**

Create a new product. The authenticated user becomes the seller.

**Body:**

```json
{
  "name": "Wireless Headphones",
  "description": "Over-ear noise cancelling headphones with 30h battery.",
  "price": 299.99,
  "stock": 50,
  "category": "Electronics",
  "images": ["https://cdn.example.com/img1.jpg"]
}
```

| Field | Rules |
|-------|-------|
| name | 3–120 characters |
| description | 10–2000 characters |
| price | Positive number |
| stock | Non-negative integer |
| category | 2–60 characters |
| images | 1–10 valid URLs |

**Response `201`.**

---

### PATCH /products/:id

**Auth required. Role: `admin` or `superadmin`.**

**Body** (all fields optional, at least one required):

```json
{
  "price": 249.99,
  "stock": 45,
  "status": "inactive"
}
```

Status transitions: `active` ↔ `inactive`. Deleted products cannot be updated.

---

### DELETE /products/:id

**Auth required. Role: `admin` or `superadmin`.**

Performs a **soft delete** — the product is marked as `deleted` and hidden from listings but not removed from the database.

**Response `200`.**

---

## Orders

### POST /orders

**Auth required.**

Create an order from a list of products. Stock is validated and reserved at creation time.

**Body:**

```json
{
  "items": [
    { "productId": "uuid", "quantity": 2 },
    { "productId": "uuid", "quantity": 1 }
  ]
}
```

| Field | Rules |
|-------|-------|
| items | Array with at least 1 item |
| productId | Valid UUID |
| quantity | Positive integer |

**Response `201`** with the created order including computed totals.

---

### GET /orders

**Auth required.**

List orders. Regular users see only their own orders; admins and superadmins see all.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| status | `PENDING` \| `AWAITING_PAYMENT` \| `CONFIRMED` \| `CANCELLED` | Filter by status |
| page | number (default 1) | Page number |
| limit | number (default 20, max 100) | Items per page |

---

### GET /orders/:id

**Auth required.**

Get full order details. Regular users can only fetch their own orders.

---

### PATCH /orders/:id/cancel

**Auth required.**

Cancel an order. Only the buyer or a privileged role can cancel. Only `PENDING` and `AWAITING_PAYMENT` orders can be cancelled.

No body required.

---

## Payments

### POST /payments/initiate

**Auth required.**

Initiate a Wompi payment transaction for an existing order.

**Body:**

```json
{
  "orderId": "uuid",
  "method": "CARD",
  "acceptanceToken": "token_from_wompi",
  "personalDataAuthToken": "token_from_wompi",
  "customerData": {
    "fullName": "Jane Doe",
    "phoneNumber": "3001234567",
    "phoneNumberPrefix": "+57",
    "legalId": "123456789",
    "legalIdType": "CC"
  },
  "redirectUrl": "https://myapp.com/payment/result",
  "paymentMethodData": {}
}
```

| Field | Rules |
|-------|-------|
| orderId | Valid UUID |
| method | `CARD`, `BANCOLOMBIA_TRANSFER`, `NEQUI`, `PSE`, `BANCOLOMBIA_QR`, or `DAVIPLATA` |
| acceptanceToken | Required, obtained from Wompi API |
| personalDataAuthToken | Required, obtained from Wompi API |

**Response `201`** with the payment record including `wompiRedirectUrl` if applicable.

---

### GET /payments/:id

**Auth required.**

Get payment details. Buyers can only fetch their own payments; admins and superadmins can fetch any.

---

### POST /payments/webhook

**Wompi webhook only.** Signature verified via `X-Event-Checksum` header.

Do **not** call this endpoint manually. Wompi calls it automatically when a transaction status changes. The server processes the event and updates the payment and order status accordingly.

---

## Order & Payment Status Flow

```
Order:    PENDING → AWAITING_PAYMENT → CONFIRMED
                 ↘                  ↘
                  CANCELLED          CANCELLED

Payment:  INITIATED → PENDING → APPROVED
                             ↘ DECLINED
                             ↘ VOIDED
                             ↘ ERROR
```

A confirmed order means the payment was approved by Wompi.
