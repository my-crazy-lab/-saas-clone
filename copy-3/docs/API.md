# SaaS Analytics Dashboard API Documentation

## Base URL
```
http://localhost:8000
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "Password123!",
  "role": "VIEWER" // Optional: "ADMIN" or "VIEWER"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "VIEWER",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  },
  "message": "User registered successfully"
}
```

#### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "VIEWER",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  },
  "message": "Login successful"
}
```

#### GET /api/auth/profile
Get current user profile. Requires authentication.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "VIEWER",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Dashboard

#### GET /api/dashboard
Get dashboard data with charts and metrics. Requires authentication.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string  
- `period` (optional): "7d", "30d", "90d", "1y"

**Response:**
```json
{
  "success": true,
  "data": {
    "mrrChart": [
      { "date": "2024-01-01", "value": 1000 },
      { "date": "2024-01-02", "value": 1050 }
    ],
    "churnChart": [
      { "date": "2024-01-01", "value": 5.2 },
      { "date": "2024-01-08", "value": 4.8 }
    ],
    "revenueChart": [
      { "date": "2024-01-01", "value": 500 },
      { "date": "2024-01-02", "value": 750 }
    ],
    "planDistribution": [
      {
        "planName": "Basic Plan",
        "count": 150,
        "revenue": 4500
      }
    ],
    "summary": {
      "currentMrr": 15000,
      "mrrGrowth": 12.5,
      "churnRate": 4.2,
      "activeSubscriptions": 500,
      "totalRevenue": 45000
    }
  }
}
```

#### GET /api/dashboard/metrics
Get raw metrics data. Requires authentication.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `period` (optional): "7d", "30d", "90d", "1y"

**Response:**
```json
{
  "success": true,
  "data": {
    "mrr": 15000,
    "churn": 0.042,
    "ltv": 2500,
    "activeUsers": 500,
    "totalRevenue": 45000,
    "totalRefunds": 1200
  }
}
```

### Accounts

#### GET /api/accounts
Get connected payment accounts. Requires authentication.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "account_id",
      "provider": "STRIPE",
      "providerId": "acct_stripe_id",
      "connectedAt": "2024-01-01T00:00:00.000Z",
      "isActive": true,
      "_count": {
        "subscriptions": 25
      }
    }
  ]
}
```

#### POST /api/accounts/connect
Connect a new payment account. Requires authentication.

**Request Body:**
```json
{
  "provider": "STRIPE", // or "PAYPAL"
  "authCode": "authorization_code_from_oauth"
}
```

**Response:**
```json
{
  "success": true,
  "message": "STRIPE account connected successfully"
}
```

#### DELETE /api/accounts/:accountId
Disconnect a payment account. Requires authentication.

**Response:**
```json
{
  "success": true,
  "message": "Account disconnected successfully"
}
```

#### POST /api/accounts/:accountId/sync
Sync account data from payment provider. Requires authentication.

**Response:**
```json
{
  "success": true,
  "message": "Account synced successfully"
}
```

#### GET /api/accounts/:accountId/subscriptions
Get subscriptions for a specific account. Requires authentication.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "id": "sub_id",
        "customerId": "cust_id",
        "planId": "plan_id",
        "planName": "Basic Plan",
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": null,
        "status": "ACTIVE",
        "price": 29.99,
        "currency": "USD",
        "billingCycle": "MONTHLY",
        "_count": {
          "transactions": 3
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Webhooks

#### POST /webhooks/stripe
Stripe webhook endpoint for real-time updates.

**Headers:**
- `stripe-signature`: Stripe webhook signature

**Body:** Raw Stripe webhook payload

#### POST /webhooks/paypal
PayPal webhook endpoint for real-time updates.

**Body:** PayPal webhook payload

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate resource)
- `500`: Internal Server Error

## Rate Limiting

API endpoints are rate limited:
- General endpoints: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Webhook endpoints: 100 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time
