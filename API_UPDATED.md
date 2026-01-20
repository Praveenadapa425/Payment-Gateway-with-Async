# Payment Gateway API Documentation (Deliverable 2)

## Base URL
`http://localhost:8000`

## Authentication
All private API endpoints require authentication using the following headers:
- `X-Api-Key`: Merchant API key
- `X-Api-Secret`: Merchant API secret

Default test credentials:
- API Key: `key_test_abc123`
- API Secret: `secret_test_xyz789`

## Health Check

### GET /health
Check system health and database connectivity.

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "worker": "running",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Test Endpoints

### GET /api/v1/test/merchant
Returns test merchant details if seeded correctly.

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "test@example.com",
  "api_key": "key_test_abc123",
  "seeded": true
}
```

### GET /api/v1/test/jobs/status
Returns job queue statistics.

**Response (200):**
```json
{
  "pending": 5,
  "processing": 2,
  "completed": 100,
  "failed": 0,
  "worker_status": "running"
}
```

## Orders

### POST /api/v1/orders
Create a new payment order.

**Headers:**
- `X-Api-Key`: API key
- `X-Api-Secret`: API secret
- `Content-Type`: application/json

**Request Body:**
```json
{
  "amount": 50000,
  "currency": "INR",
  "receipt": "receipt_123",
  "notes": {
    "customer_name": "John Doe"
  }
}
```

**Response (201 Created):**
```json
{
  "id": "order_NXhj67fGH2jk9mPq",
  "merchant_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 50000,
  "currency": "INR",
  "receipt": "receipt_123",
  "notes": {
    "customer_name": "John Doe"
  },
  "status": "created",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### GET /api/v1/orders/{order_id}
Get order details.

**Headers:**
- `X-Api-Key`: API key
- `X-Api-Secret`: API secret

**Response (200):**
```json
{
  "id": "order_NXhj67fGH2jk9mPq",
  "merchant_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 50000,
  "currency": "INR",
  "receipt": "receipt_123",
  "notes": {},
  "status": "created",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

## Payments

### POST /api/v1/payments
Process a payment for an order (asynchronous).

**Headers:**
- `X-Api-Key`: API key
- `X-Api-Secret`: API secret
- `Idempotency-Key`: (optional) Unique request identifier
- `Content-Type`: application/json

**Request Body (UPI):**
```json
{
  "order_id": "order_NXhj67fGH2jk9mPq",
  "method": "upi",
  "vpa": "user@paytm"
}
```

**Request Body (Card):**
```json
{
  "order_id": "order_NXhj67fGH2jk9mPq",
  "method": "card",
  "card": {
    "number": "4111111111111111",
    "expiry_month": "12",
    "expiry_year": "2025",
    "cvv": "123",
    "holder_name": "John Doe"
  }
}
```

**Response (201 Created):**
```json
{
  "id": "pay_H8sK3jD9s2L1pQr",
  "order_id": "order_NXhj67fGH2jk9mPq",
  "amount": 50000,
  "currency": "INR",
  "method": "upi",
  "vpa": "user@paytm",
  "status": "pending",
  "created_at": "2024-01-15T10:31:00Z"
}
```

### GET /api/v1/payments/{payment_id}
Get payment details.

**Headers:**
- `X-Api-Key`: API key
- `X-Api-Secret`: API secret

**Response (200):**
```json
{
  "id": "pay_H8sK3jD9s2L1pQr",
  "order_id": "order_NXhj67fGH2jk9mPq",
  "amount": 50000,
  "currency": "INR",
  "method": "upi",
  "vpa": "user@paytm",
  "status": "success",
  "created_at": "2024-01-15T10:31:00Z",
  "updated_at": "2024-01-15T10:31:10Z"
}
```

### POST /api/v1/payments/{payment_id}/capture
Capture a successful payment.

**Headers:**
- `X-Api-Key`: API key
- `X-Api-Secret`: API secret
- `Content-Type`: application/json

**Request Body:**
```json
{
  "amount": 50000
}
```

**Response (200):**
```json
{
  "id": "pay_H8sK3jD9s2L1pQr",
  "order_id": "order_NXhj67fGH2jk9mPq",
  "amount": 50000,
  "currency": "INR",
  "method": "upi",
  "status": "success",
  "captured": true,
  "created_at": "2024-01-15T10:31:00Z",
  "updated_at": "2024-01-15T10:32:00Z"
}
```

## Refunds

### POST /api/v1/payments/{payment_id}/refunds
Create a refund for a payment.

**Headers:**
- `X-Api-Key`: API key
- `X-Api-Secret`: API secret
- `Content-Type`: application/json

**Request Body:**
```json
{
  "amount": 50000,
  "reason": "Customer requested refund"
}
```

**Response (201 Created):**
```json
{
  "id": "rfnd_K9pL2mN4oQ5r",
  "payment_id": "pay_H8sK3jD9s2L1pQr",
  "amount": 50000,
  "reason": "Customer requested refund",
  "status": "pending",
  "created_at": "2024-01-15T10:33:00Z"
}
```

### GET /api/v1/refunds/{refund_id}
Get refund details.

**Headers:**
- `X-Api-Key`: API key
- `X-Api-Secret`: API secret

**Response (200):**
```json
{
  "id": "rfnd_K9pL2mN4oQ5r",
  "payment_id": "pay_H8sK3jD9s2L1pQr",
  "amount": 50000,
  "reason": "Customer requested refund",
  "status": "processed",
  "created_at": "2024-01-15T10:33:00Z",
  "processed_at": "2024-01-15T10:33:05Z"
}
```

## Webhooks

### GET /api/v1/webhooks
List webhook delivery logs.

**Headers:**
- `X-Api-Key`: API key
- `X-Api-Secret`: API secret

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "event": "payment.success",
      "status": "success",
      "attempts": 1,
      "created_at": "2024-01-15T10:31:10Z",
      "last_attempt_at": "2024-01-15T10:31:11Z",
      "response_code": 200
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

### POST /api/v1/webhooks/{webhook_id}/retry
Retry a failed webhook delivery.

**Headers:**
- `X-Api-Key`: API key
- `X-Api-Secret`: API secret

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "status": "pending",
  "message": "Webhook retry scheduled"
}
```

## Error Codes

- `AUTHENTICATION_ERROR` - Invalid API credentials
- `BAD_REQUEST_ERROR` - Validation errors
- `NOT_FOUND_ERROR` - Resource not found
- `PAYMENT_FAILED` - Payment processing failed
- `INVALID_VPA` - VPA format invalid
- `INVALID_CARD` - Card validation failed
- `EXPIRED_CARD` - Card expiry date invalid
- `INSUFFICIENT_REFUND_AMOUNT` - Refund amount exceeds available

## Webhook Events

The system emits the following webhook events:

- `payment.created` - When payment record is created
- `payment.pending` - When payment enters pending state
- `payment.success` - When payment succeeds
- `payment.failed` - When payment fails
- `refund.created` - When refund is initiated
- `refund.processed` - When refund completes

## Webhook Payload Format

```json
{
  "event": "payment.success",
  "timestamp": 1705315870,
  "data": {
    "payment": {
      "id": "pay_H8sK3jD9s2L1pQr",
      "order_id": "order_NXhj67fGH2jk9mPq",
      "amount": 50000,
      "currency": "INR",
      "method": "upi",
      "vpa": "user@paytm",
      "status": "success",
      "created_at": "2024-01-15T10:31:00Z"
    }
  }
}
```

## HMAC Signature Verification

Webhook payloads are signed using HMAC-SHA256:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === expectedSignature;
}
```

## Test Mode Configuration

For deterministic testing, use these environment variables:

```bash
TEST_MODE=true
TEST_PAYMENT_SUCCESS=true
TEST_PROCESSING_DELAY=1000
WEBHOOK_RETRY_INTERVALS_TEST=true
```

When `WEBHOOK_RETRY_INTERVALS_TEST=true`, retry intervals are:
- Attempt 1: 0 seconds (immediate)
- Attempt 2: 5 seconds
- Attempt 3: 10 seconds
- Attempt 4: 15 seconds
- Attempt 5: 20 seconds