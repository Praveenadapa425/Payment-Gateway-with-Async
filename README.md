# Payment Gateway System

> **Comprehensive Payment Gateway Solution**
> 
> A full-stack payment gateway system designed to handle merchant onboarding, order management, and multi-method payment processing with industry-standard security and reliability.

## 🚀 Key Features

- **Secure RESTful API** with robust merchant authentication using API keys and secrets
- **Multi-Method Payment Processing** supporting UPI and Card transactions
- **Hosted Checkout Experience** for seamless customer payment flows
- **Containerized Architecture** with Docker for easy deployment
- **Advanced Validation** for payment methods (VPA format, Luhn algorithm, card network detection)
- **Reliable Database Storage** with PostgreSQL persistence
- **Merchant Dashboard** for transaction monitoring and analytics
- **Automated Seeding** with test merchant credentials
- **Complete Status Flow** with proper processing → success/failed transitions
- **Secure Card Handling** with PCI-compliant data practices
- **Real-Time Polling** for live payment status updates
- **Professional UI/UX** with responsive design
- **Indian Rupee (₹) Support** with proper currency formatting

## 🏗️ System Architecture

The payment gateway follows a microservices architecture pattern with the following components:

- **Backend API**: Java Spring Boot application with RESTful endpoints
- **Database Layer**: PostgreSQL database for secure data persistence
- **Merchant Dashboard**: React-based administrative interface
- **Customer Checkout**: React-powered payment processing interface
- **Reverse Proxy**: Nginx for efficient static asset delivery

## 📋 Prerequisites

Before deploying the payment gateway, ensure your system meets the following requirements:

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)
- **Git** for version control

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Praveenadapa425/Payment-Gateway-with-Multi-Method-Processing-and-Hosted-Checkout.git
   cd payment-gateway
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

3. **(Optional) Customize environment settings** in `.env` as needed

## ⚙️ Configuration

### Environment Variables

Customize the system behavior using the following environment variables in your `.env` file:

**Backend API Configuration:**
- `PORT` - API server port (default: 8000)
- `DATABASE_URL` - PostgreSQL connection string
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password

**Test Merchant Settings:**
- `TEST_MERCHANT_EMAIL` - Email for test merchant (default: test@example.com)
- `TEST_API_KEY` - API key for test merchant (default: key_test_abc123)
- `TEST_API_SECRET` - API secret for test merchant (default: secret_test_xyz789)

**Payment Processing Configuration:**
- `TEST_MODE` - Enable test mode for deterministic evaluation (default: false)
- `TEST_PAYMENT_SUCCESS` - Force payment success/failure in test mode (default: true)
- `TEST_PROCESSING_DELAY` - Fixed processing delay in test mode (default: 1000ms)
- `UPI_SUCCESS_RATE` - Success rate for UPI payments (default: 0.90)
- `CARD_SUCCESS_RATE` - Success rate for card payments (default: 0.95)
- `PROCESSING_DELAY_MIN` - Minimum processing delay in milliseconds (default: 5000)
- `PROCESSING_DELAY_MAX` - Maximum processing delay in milliseconds (default: 10000)

## ▶️ Running the Application

Deploy all services using Docker Compose:

```bash
docker-compose up -d
```

Upon successful deployment, the system will be accessible at the following endpoints:

| Service | URL | Description |
|--------|-----|-------------|
| **API Server** | http://localhost:8000 | Core payment gateway API |
| **Merchant Dashboard** | http://localhost:3000 | Administrative interface |
| **Customer Checkout** | http://localhost:3001 | Payment processing interface |
| **Database** | PostgreSQL on port 5432 | Internal database access |

## 🧩 System Services

The payment gateway ecosystem comprises four essential services:

1. **PostgreSQL Database** - Secure persistent storage for merchants, orders, and payments
2. **API Server** - Java Spring Boot backend orchestrating all business logic
3. **Merchant Dashboard** - React-based administrative interface for transaction management
4. **Customer Checkout** - React-powered payment processing interface

### Service Orchestration

The services follow a dependency-driven startup sequence:

- **PostgreSQL** initializes first with comprehensive health checks
- **API Server** launches upon PostgreSQL health confirmation
- **Frontend Services** (Dashboard & Checkout) start once API server is operational

## 🔐 Default Test Credentials

For immediate testing, the system automatically provisions a test merchant account:

| Credential | Value |
|------------|-------|
| **Email** | test@example.com |
| **API Key** | key_test_abc123 |
| **API Secret** | secret_test_xyz789 |

> **💡 Tip**: These credentials enable immediate access to API endpoints and the merchant dashboard for testing purposes.



## 🗄️ Database Schema

The system utilizes PostgreSQL with a normalized schema design:

### merchants Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key - unique merchant identifier |
| `name` | VARCHAR | Merchant name |
| `email` | VARCHAR | Unique email address |
| `api_key` | VARCHAR | Unique API key for authentication |
| `api_secret` | VARCHAR | API secret for authentication |
| `webhook_url` | VARCHAR | Webhook callback URL |
| `is_active` | BOOLEAN | Active status flag |
| `created_at`, `updated_at` | TIMESTAMP | Record timestamps |

### orders Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(64) | Primary key (format: order_xxxxxxxxxxxxxxxx) |
| `merchant_id` | UUID | Foreign key referencing merchants |
| `amount` | BIGINT | Amount in paise (smallest currency unit) |
| `currency` | VARCHAR | Currency code (default: INR) |
| `receipt` | VARCHAR | Receipt identifier |
| `notes` | JSONB | Additional data in JSON format |
| `status` | VARCHAR | Order status (default: created) |
| `created_at`, `updated_at` | TIMESTAMP | Record timestamps |

### payments Table
| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(64) | Primary key (format: pay_xxxxxxxxxxxxxxxx) |
| `order_id` | VARCHAR(64) | Foreign key referencing orders |
| `merchant_id` | UUID | Foreign key referencing merchants |
| `amount` | BIGINT | Amount in paise |
| `currency` | VARCHAR | Currency code (default: INR) |
| `method` | VARCHAR | Payment method (upi, card) |
| `status` | VARCHAR | Payment status (processing, success, failed) |
| `vpa` | VARCHAR | Virtual Payment Address for UPI |
| `card_network` | VARCHAR | Detected card network |
| `card_last4` | VARCHAR | Last 4 digits of card |
| `error_code`, `error_description` | VARCHAR | Error details for failed payments |
| `created_at`, `updated_at` | TIMESTAMP | Record timestamps |

## 💳 Payment Processing Flow

The system follows a secure and reliable payment processing workflow:

1. **Order Creation**: Merchant initiates an order via API with amount and relevant details
2. **Checkout Redirection**: Customer is securely redirected to checkout page with encrypted order_id
3. **Public Order Retrieval**: Checkout page retrieves order details via secured public API
4. **Payment Processing**: Customer enters payment credentials and submits securely
5. **Payment Validation**: System validates payment details (VPA format, Luhn algorithm)
6. **Status Transition**: Payment initiates with 'processing' status
7. **Bank Simulation**: System simulates banking operations with configurable delay
8. **Final Status**: Payment transitions to 'success' or 'failed' based on validation
9. **Status Polling**: Checkout page continuously polls for status updates every 2 seconds
10. **Result Display**: Final transaction outcome is presented to the customer

## 🔒 Security Measures

The system implements industry-standard security practices:

- **API Authentication** with X-Api-Key and X-Api-Secret headers
- **PCI Compliance** - No storage of full card numbers or CVV codes
- **Card Validation** using Luhn algorithm for number verification
- **VPA Validation** with proper format checking for UPI transactions
- **Input Sanitization** and comprehensive validation for all inputs
- **SQL Injection Prevention** through JPA repositories and parameterized queries
- **Rate Limiting Capabilities** (configurable with Spring Cloud Gateway)

## 🖥️ Frontend Applications

### Merchant Dashboard (Port 3000)

A comprehensive administrative interface featuring:

- **API Credential Management** with secure display and optional masking
- **Real-Time Analytics** with transaction metrics (volume, value, success rates)
- **Transaction History** with advanced filtering and search capabilities
- **Modern UI Design** with responsive, mobile-first approach
- **Automated Testing Support** with comprehensive data-test-id attributes
- **Regional Currency Support** with Indian Rupee (₹) formatting

### Customer Checkout (Port 3001)

A secure payment processing interface with:

- **Multi-Method Support** for both UPI and card transactions
- **Real-Time Status Updates** with live payment tracking
- **Interactive UI Elements** with animated processing indicators
- **Clear Outcome Messaging** for success and failure states
- **Comprehensive Validation** for all payment inputs
- **Mobile-Responsive Design** for cross-device compatibility
- **Automated Testing Support** with comprehensive data-test-id attributes

## ✅ Validation Logic

The system incorporates comprehensive validation mechanisms:

- **VPA Validation**: Employs regex pattern `^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$` for UPI ID verification
- **Luhn Algorithm**: Implements standard algorithm for card number validation
- **Card Network Detection**: Automatically identifies Visa, Mastercard, Amex, and RuPay networks
- **Card Expiry Validation**: Validates month/year format and ensures future dates
- **Amount Validation**: Enforces minimum threshold of 100 paise (₹1)
- **Order Ownership**: Confirms orders belong to authenticated merchants

## 🧪 Test Mode Configuration

The system provides configurable test environments for deterministic evaluation:

- **`TEST_MODE=true`** enables predictable payment outcomes for consistent testing
- **`TEST_PAYMENT_SUCCESS=true/false`** forces predetermined success or failure states
- **`TEST_PROCESSING_DELAY`** sets fixed processing delays for reliable test execution
- **`WEBHOOK_RETRY_INTERVALS_TEST=true`** enables shortened webhook retry intervals for testing

## 🔗 Webhook Configuration

Merchants can configure webhooks to receive real-time payment events:

1. **Configure Webhook URL** in merchant settings
2. **Set Webhook Secret** for HMAC signature verification
3. **Receive Events** for payment success, failure, and refund processing

### Webhook Event Structure
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
      "status": "success",
      "created_at": "2024-01-15T10:31:00Z"
    }
  }
}
```

### HMAC Signature Verification
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

### Test Webhook Receiver
For testing webhook delivery, run a simple receiver:

```javascript
// test-webhook-server.js
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  
  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', 'whsec_test_abc123')
    .update(payload)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return res.status(401).send('Invalid signature');
  }
  
  console.log('✅ Webhook verified:', req.body.event);
  res.status(200).send('OK');
});

app.listen(4000, () => {
  console.log('Test webhook server running on port 4000');
});
```

Configure your webhook URL to `http://host.docker.internal:4000/webhook` (Mac/Windows) or `http://172.17.0.1:4000/webhook` (Linux).

## ⚠️ Error Handling

The system employs standardized error codes for consistent API responses:

| Error Code | Description |
|------------|-------------|
| `AUTHENTICATION_ERROR` | Invalid API credentials |
| `BAD_REQUEST_ERROR` | Validation errors |
| `NOT_FOUND_ERROR` | Resource not found |
| `PAYMENT_FAILED` | Payment processing failed |
| `INVALID_VPA` | VPA format invalid |
| `INVALID_CARD` | Card validation failed |

REST-compliant HTTP status codes:

- **201 Created** - Resource successfully created (orders, payments)
- **200 OK** - Successful GET requests
- **400 Bad Request** - Validation errors
- **401 Unauthorized** - Authentication failures
- **404 Not Found** - Resource not found

## 🚀 Production Deployment

The system is engineered for containerized, production-ready deployment:

1. **Build Services**: Execute `docker-compose build` to compile all components
2. **Launch Infrastructure**: Run `docker-compose up -d` for daemonized deployment
3. **Auto-Configuration**: All services initialize and establish interconnections automatically
4. **Schema Initialization**: Database schema is provisioned automatically
5. **Merchant Seeding**: Test merchant account is created automatically
6. **Health Verification**: Built-in health checks ensure service readiness



## 🛠️ Development Guidelines

### Local Development Environment

For development without Docker containers:

1. **Backend API**: Execute `mvn spring-boot:run` in the backend directory
2. **Merchant Dashboard**: Execute `npm start` in the frontend directory
3. **Customer Checkout**: Execute `npm start` in the checkout-page directory

### Production Image Construction

Compile all services:
```bash
docker-compose build
```

Perform clean rebuild if required:
```bash
docker-compose build --no-cache
```

### Service Management

Terminate all services:
```bash
docker-compose down
```

Terminate and purge volumes:
```bash
docker-compose down -v
```

## 📊 Monitoring and Maintenance

### Health Monitoring

The system provides comprehensive health monitoring capabilities:

- **`/health`** - Overall system health status with detailed diagnostics
- **Docker Health Checks** - Continuous PostgreSQL readiness monitoring

## 🎬 Visual Demonstrations

### Demo Video

**[Complete Payment Gateway Demo](https://vimeo.com/1153118558/41cdffc48b)** (2-3 minutes)

Comprehensive demonstration showcasing both the merchant dashboard and customer checkout frontend interfaces, highlighting the complete payment flow from order creation to successful payment completion.

