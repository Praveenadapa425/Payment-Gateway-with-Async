# Payment Gateway

A comprehensive payment gateway system similar to Razorpay or Stripe, built with merchant onboarding, payment order management, and multi-method payment processing.

## Features

- RESTful API with merchant authentication using API key and secret
- Support for UPI and Card payment methods
- Hosted checkout page for customer payments
- Dockerized deployment with single command setup
- Proper validation for payment methods (VPA format, Luhn algorithm, card network detection)
- Database persistence with PostgreSQL
- Dashboard for merchants to view transactions
- Automated test merchant seeding

## Architecture

- Backend API: Java Spring Boot application
- Database: PostgreSQL
- Dashboard: React frontend
- Checkout Page: React frontend

## Prerequisites

- Docker
- Docker Compose

## Setup Instructions

1. Clone the repository
2. Copy `.env.example` to `.env` and configure environment variables if needed
3. Run the application using Docker Compose:

```bash
docker-compose up -d
```

## Services

- API Server: http://localhost:8000
- Dashboard: http://localhost:3000
- Checkout Page: http://localhost:3001
- Database: PostgreSQL on port 5432

## Default Test Merchant

A test merchant is automatically created on startup with the following credentials:
- Email: test@example.com
- API Key: key_test_abc123
- API Secret: secret_test_xyz789

## API Endpoints

### Health Check
- `GET /health` - Check system health

### Orders
- `POST /api/v1/orders` - Create a new order
- `GET /api/v1/orders/{order_id}` - Get order details

### Payments
- `POST /api/v1/payments` - Process a payment
- `GET /api/v1/payments/{payment_id}` - Get payment details

### Public Endpoints (for checkout page)
- `GET /api/v1/orders/{order_id}/public` - Get order details for checkout
- `POST /api/v1/payments/public` - Process payment from checkout page

### Test Endpoints
- `GET /api/v1/test/merchant` - Get test merchant details (for evaluation)

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - API server port
- `TEST_MERCHANT_EMAIL` - Email for test merchant
- `TEST_API_KEY` - API key for test merchant
- `TEST_API_SECRET` - API secret for test merchant
- `UPI_SUCCESS_RATE` - Success rate for UPI payments (0.90 = 90%)
- `CARD_SUCCESS_RATE` - Success rate for card payments (0.95 = 95%)
- `PROCESSING_DELAY_MIN` - Minimum processing delay in milliseconds
- `PROCESSING_DELAY_MAX` - Maximum processing delay in milliseconds
- `TEST_MODE` - Enable test mode for deterministic evaluation
- `TEST_PAYMENT_SUCCESS` - Force payment success/failure in test mode
- `TEST_PROCESSING_DELAY` - Fixed processing delay in test mode

## Database Schema

The application uses PostgreSQL with the following tables:

- `merchants`: Stores merchant information including API credentials
- `orders`: Stores order information with amounts and status
- `payments`: Stores payment information with method and status

The schema is automatically created on application startup.

## Validation Logic

The system includes comprehensive validation:

- VPA validation for UPI payments using regex pattern
- Luhn algorithm validation for card numbers
- Card network detection (Visa, Mastercard, Amex, RuPay)
- Card expiry date validation

## Frontend Applications

### Dashboard (Port 3000)
- Login page with test credentials
- Dashboard showing API credentials
- Transactions page with payment history

### Checkout Page (Port 3001)
- Order summary display
- Payment method selection (UPI/Card)
- Payment processing with status polling
- Success and failure states

## Payment Processing Flow

1. Create an order via API
2. Redirect customer to checkout page with order ID
3. Customer selects payment method and enters details
4. Payment is processed with simulated bank delay (5-10 seconds)
5. Payment status is updated (success/failure)
6. Checkout page polls for status and shows result

## Test Mode

The application supports test mode for deterministic evaluation:

- `TEST_MODE=true` enables deterministic payment outcomes
- `TEST_PAYMENT_SUCCESS=true/false` forces payment success/failure
- `TEST_PROCESSING_DELAY` sets fixed processing delay

## Error Handling

Standardized error codes are used throughout the API:

- `AUTHENTICATION_ERROR` - Invalid API credentials
- `BAD_REQUEST_ERROR` - Validation errors
- `NOT_FOUND_ERROR` - Resource not found
- `PAYMENT_FAILED` - Payment processing failed
- `INVALID_VPA` - VPA format invalid
- `INVALID_CARD` - Card validation failed
- `EXPIRED_CARD` - Card expiry date invalid