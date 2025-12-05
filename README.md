# Xeno FDE - Multi-Tenant Shopify Data Ingestion & Insights Service

A comprehensive multi-tenant platform for ingesting, storing, and analyzing Shopify store data. This service enables enterprise retailers to onboard multiple Shopify stores, sync customer/order/product data, and visualize business insights through an intuitive dashboard.

## 🏗️ High-Level Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│   React Frontend │────────▶│  Express Backend │────────▶│   MySQL DB   │
│   (Dashboard)   │         │   (REST API)     │         │  (Multi-     │
└─────────────────┘         └──────────────────┘         │   Tenant)    │
                                                          └──────────────┘
         │                           │                            │
         │                           │                            │
         │                           ▼                            │
         │                  ┌──────────────────┐                 │
         │                  │   Redis Queue    │                 │
         │                  │  (Async Tasks)   │                 │
         │                  └──────────────────┘                 │
         │                                                         │
         │                           │                            │
         │                           ▼                            │
         │                  ┌──────────────────┐                 │
         │                  │  Node Cron       │                 │
         │                  │  (Scheduler)     │                 │
         │                  └──────────────────┘                 │
         │                                                         │
         └─────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Shopify API     │
                         │  (Customers,     │
                         │   Orders,        │
                         │   Products)      │
                         └──────────────────┘
```

### Technology Stack

**Backend:**
- Node.js + Express.js
- MySQL (Multi-tenant data isolation)
- Redis (Async task queue)
- Node-cron (Scheduled syncs)
- JWT (Authentication)
- Bcrypt (Password hashing)

**Frontend:**
- React 19
- React Router
- Recharts (Data visualization)
- Tailwind CSS
- Vite

## 📋 Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- Redis (v6.0 or higher)
- npm or yarn

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Xeno-FDE
```

### 2. Install Dependencies

**Root directory (backend dependencies):**
```bash
npm install
```

**Frontend directory:**
```bash
cd frontend
npm install
cd ..
```

**Or install all at once:**
```bash
npm run build
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and update with your values:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=xeno_fde
JWT_SECRET=your-secret-key-here
REDIS_URL=redis://localhost:6379
ENCRYPTION_KEY=your-32-byte-hex-string
SHOPIFY_CLIENT_SECRET=shpss_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important Environment Variables:**
- **ENCRYPTION_KEY** - 32-byte hex string for encrypting sensitive credentials (access tokens, API keys, secrets)
  - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - **Required for production** - Without this, a random key is generated on each restart (credentials won't be decryptable)
- **SHOPIFY_CLIENT_SECRET** - Your Shopify app's API Secret Key (required for webhook HMAC verification)
  - Format: `shpss_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
  - Found in: Shopify Partner Dashboard → Your App → API credentials → API secret key

### 4. Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE xeno_fde;
```

2. The application will automatically create all required tables on first run.

### 5. Redis Setup

1. Install and start Redis:
```bash
# On macOS (using Homebrew)
brew install redis
brew services start redis

# On Linux
sudo apt-get install redis-server
sudo systemctl start redis

# On Windows
# Download and install from https://redis.io/download
```

2. Verify Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

### 6. Start the Application

**Development mode:**

Terminal 1 (Backend):
```bash
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

**Production mode:**
```bash
npm start
# Frontend will be served from backend after build
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Complete Installation Command Sequence

For a fresh installation, run these commands in order:

```bash
# 1. Install root dependencies
npm install

# 2. Install frontend dependencies
cd frontend && npm install && cd ..

# 3. Copy environment file
cp env.example .env

# 4. Edit .env with your database credentials

# 5. Start MySQL and Redis services

# 6. Create database
mysql -u root -p -e "CREATE DATABASE xeno_fde;"

# 7. Start backend (Terminal 1)
npm run dev

# 8. Start frontend (Terminal 2)
cd frontend && npm run dev
```

## 📚 API Endpoints

### Authentication

- `POST /api/auth/signup` - Create new user account
  - Body: `{ "email": "user@example.com", "password": "password123", "name": "User Name" }`
  - Returns: `{ "token": "jwt-token", "user": {...} }`

- `POST /api/auth/signin` - Sign in user
  - Body: `{ "email": "user@example.com", "password": "password123" }`
  - Returns: `{ "token": "jwt-token", "user": {...} }`

- `GET /api/auth/profile` - Get user profile (requires auth)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ "user": {...} }`

### Tenants (Stores)

- `POST /api/tenants` - Connect a new Shopify store (requires auth)
  - Body: `{ "shop_domain": "store.myshopify.com", "access_token": "shpat_xxx" }`
  - Returns: `{ "tenant": {...} }`

- `GET /api/tenants` - List all connected stores (requires auth)
  - Returns: `[{ "id": 1, "shop_domain": "...", ... }, ...]`

- `GET /api/tenants/:id` - Get store details (requires auth)
  - Returns: `{ "tenant": {...} }`

- `POST /api/tenants/:id/sync` - Trigger manual data sync (requires auth)
  - Returns: `{ "message": "Sync started" }`

- `DELETE /api/tenants/:id` - Disconnect a store (requires auth)
  - Returns: `{ "message": "Tenant deleted" }`

### Data Ingestion

- `POST /api/ingestion/:tenantId/sync` - Trigger sync for a tenant (requires auth)
  - Returns: `{ "message": "Sync queued" }`

- `POST /api/ingestion/webhook` - Shopify webhook endpoint (HMAC verified)
  - Body: Shopify webhook payload
  - Headers: `X-Shopify-Hmac-Sha256` for verification

### Insights

- `GET /api/insights/:tenantId/dashboard` - Get dashboard statistics (requires auth)
  - Returns: `{ "totalCustomers": 100, "totalOrders": 50, "totalRevenue": 5000, "avgOrderValue": 100 }`

- `GET /api/insights/:tenantId/orders-by-date` - Get orders grouped by date (requires auth)
  - Query params: `?startDate=2024-01-01&endDate=2024-12-31`
  - Returns: `[{ "date": "2024-01-01", "count": 10, "revenue": 1000 }, ...]`

- `GET /api/insights/:tenantId/top-customers` - Get top customers by spend (requires auth)
  - Query params: `?limit=5` (default: 5)
  - Returns: `[{ "email": "...", "totalSpent": 500, "ordersCount": 3 }, ...]`

- `GET /api/insights/:tenantId/revenue-trends` - Get revenue trends over time (requires auth)
  - Query params: `?startDate=2024-01-01&endDate=2024-12-31`
  - Returns: `[{ "date": "2024-01-01", "revenue": 1000, "avgOrderValue": 100 }, ...]`

- `GET /api/insights/:tenantId/products` - Get product performance data (requires auth)
  - Returns: `[{ "title": "...", "totalInventory": 100, "price": 50 }, ...]`

- `GET /api/insights/:tenantId/order-status` - Get order status distribution (requires auth)
  - Returns: `{ "paid": 10, "pending": 2, "refunded": 1, ... }`

- `GET /api/insights/:tenantId/revenue-by-day` - Get revenue by day of week (requires auth)
  - Returns: `[{ "day": "Monday", "revenue": 1000 }, ...]`

- `GET /api/insights/:tenantId/customer-acquisition` - Get customer acquisition trends (requires auth)
  - Returns: `[{ "date": "2024-01-01", "newCustomers": 5 }, ...]`

- `GET /api/insights/:tenantId/monthly-revenue` - Get monthly revenue breakdown (requires auth)
  - Returns: `[{ "month": "2024-01", "revenue": 5000 }, ...]`

- `GET /api/insights/:tenantId/order-value-distribution` - Get order value distribution (requires auth)
  - Returns: `[{ "range": "0-50", "count": 10 }, ...]`

- `GET /api/insights/:tenantId/growth-metrics` - Get growth metrics (requires auth)
  - Returns: `{ "revenueGrowth": 10.5, "customerGrowth": 5.2, ... }`

## 🗄️ Database Schema

### Core Tables

**users**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `email` (VARCHAR(255), UNIQUE, NOT NULL)
- `password_hash` (VARCHAR(255), NOT NULL)
- `name` (VARCHAR(255))
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)

**tenants**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `user_id` (INT, FOREIGN KEY → users.id, ON DELETE CASCADE)
- `shop_domain` (VARCHAR(255), UNIQUE, NOT NULL)
- `shop_name` (VARCHAR(255))
- `access_token` (TEXT) - Encrypted at rest
- `api_key` (VARCHAR(255)) - Encrypted at rest
- `api_secret` (VARCHAR(255)) - Encrypted at rest
- `webhook_secret` (VARCHAR(255)) - Encrypted at rest
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `last_sync_at` (TIMESTAMP, NULL)
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)
- Indexes: `idx_user_id`, `idx_shop_domain`

**customers**
- `id` (BIGINT, PRIMARY KEY, AUTO_INCREMENT)
- `tenant_id` (INT, FOREIGN KEY → tenants.id, ON DELETE CASCADE)
- `shopify_customer_id` (BIGINT, UNIQUE, NOT NULL)
- `email` (VARCHAR(255))
- `first_name` (VARCHAR(255))
- `last_name` (VARCHAR(255))
- `phone` (VARCHAR(50))
- `total_spent` (DECIMAL(10, 2), DEFAULT 0)
- `orders_count` (INT, DEFAULT 0)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `synced_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- Indexes: `idx_tenant_id`, `idx_shopify_customer_id`, `idx_email`

**orders**
- `id` (BIGINT, PRIMARY KEY, AUTO_INCREMENT)
- `tenant_id` (INT, FOREIGN KEY → tenants.id, ON DELETE CASCADE)
- `shopify_order_id` (BIGINT, UNIQUE, NOT NULL)
- `order_number` (VARCHAR(50))
- `customer_id` (BIGINT, FOREIGN KEY → customers.id, ON DELETE SET NULL)
- `email` (VARCHAR(255))
- `financial_status` (VARCHAR(50))
- `fulfillment_status` (VARCHAR(50))
- `total_price` (DECIMAL(10, 2))
- `subtotal_price` (DECIMAL(10, 2))
- `total_tax` (DECIMAL(10, 2))
- `total_discounts` (DECIMAL(10, 2))
- `currency` (VARCHAR(10))
- `order_date` (TIMESTAMP)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `synced_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- Indexes: `idx_tenant_id`, `idx_shopify_order_id`, `idx_customer_id`, `idx_order_date`, `idx_email`

**products**
- `id` (BIGINT, PRIMARY KEY, AUTO_INCREMENT)
- `tenant_id` (INT, FOREIGN KEY → tenants.id, ON DELETE CASCADE)
- `shopify_product_id` (BIGINT, UNIQUE, NOT NULL)
- `title` (VARCHAR(500))
- `handle` (VARCHAR(255))
- `vendor` (VARCHAR(255))
- `product_type` (VARCHAR(255))
- `status` (VARCHAR(50))
- `total_inventory` (INT, DEFAULT 0)
- `price` (DECIMAL(10, 2))
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `synced_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- Indexes: `idx_tenant_id`, `idx_shopify_product_id`

**custom_events**
- `id` (BIGINT, PRIMARY KEY, AUTO_INCREMENT)
- `tenant_id` (INT, FOREIGN KEY → tenants.id, ON DELETE CASCADE)
- `event_type` (VARCHAR(100), NOT NULL) - e.g., 'checkout_started', 'cart_abandoned'
- `event_data` (JSON)
- `customer_id` (BIGINT, FOREIGN KEY → customers.id, ON DELETE SET NULL)
- `order_id` (BIGINT, FOREIGN KEY → orders.id, ON DELETE SET NULL)
- `product_id` (BIGINT, FOREIGN KEY → products.id, ON DELETE SET NULL)
- `occurred_at` (TIMESTAMP, NOT NULL)
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- Indexes: `idx_tenant_id`, `idx_event_type`, `idx_occurred_at`

### Multi-Tenant Architecture

All data tables include `tenant_id` foreign keys for strict data isolation. Each user can connect multiple Shopify stores, and all data is isolated per tenant.

## 🔐 Authentication & Security

- **JWT-based authentication** for API access
- **Bcrypt password hashing** (10 rounds)
- **AES-256-GCM encryption** for sensitive credentials (access tokens, API keys, secrets) stored at rest
- **Multi-tenant data isolation** via `tenant_id` foreign keys
- **Token expiration** (configurable, default 7 days)
- **CORS enabled** for frontend-backend communication
- **HMAC verification** for Shopify webhooks using `SHOPIFY_CLIENT_SECRET`

## 🔄 Data Synchronization

### Automatic Sync
- **Hourly cron job** syncs all active tenants
- Runs at the top of every hour
- Updates `last_sync_at` timestamp

### Manual Sync
- Triggered via API endpoint or dashboard button
- Processes customers, orders, and products
- Uses pagination to handle large datasets

### Webhooks (Optional)
- Shopify webhooks can be configured for real-time updates
- **HMAC verification enabled** - Webhooks are verified using your Shopify app's API Secret Key
- Supported events: orders/create, orders/update, customers/create, customers/update, products/create, products/update, checkouts/create
- Configure `SHOPIFY_CLIENT_SECRET` in `.env` for webhook verification

### Async Processing
- Redis queue for background task processing
- Prevents API timeouts on large syncs
- Tasks processed in FIFO order

## 📊 Dashboard Features

- **Overview Statistics**: Total customers, orders, revenue, average order value
- **Revenue Trends**: Line chart showing revenue and AOV over time
- **Orders by Date**: Bar chart with order count and revenue
- **Top Customers**: Table of top 5 customers by total spend
- **Multi-Store Support**: Switch between connected stores
- **Real-time Sync**: Manual sync button with status indicator

## 🚧 Known Limitations & Assumptions

### Shopify API Limitations

1. **Personal Details of Customers Not Available in Free Plan**
   - Personal details (email, phone, first name, last name) of customers are **not available** in Shopify's free plan
   - To access full customer personal details, you need to **upgrade to a paid Shopify plan**
   - The free plan only provides limited customer information
   - This limitation affects the completeness of customer data synced to the platform

### Technical Limitations

2. **Order Line Items**: Product-order relationships not fully tracked (simplified schema).

3. **Rate Limiting**: No Shopify API rate limiting implemented. May need throttling for high-volume stores.

4. **Data Retention**: No automatic cleanup of old data.

5. **Concurrent Syncs**: Multiple simultaneous syncs for same tenant not prevented.

6. **Error Recovery**: Failed sync tasks not automatically retried.

7. **Analytics**: Basic metrics only. Advanced cohort analysis, LTV calculations not included.

### Design Assumptions

1. **Multi-Tenancy**: Data isolation via `tenant_id` foreign keys. Each user can have multiple stores, but data is strictly isolated.

2. **Shopify API**: Using Admin API (not GraphQL) for simplicity. Assumes access tokens with read permissions.

3. **Data Sync Strategy**: 
   - Initial full sync on tenant creation
   - Incremental syncs use `since_id` for orders
   - Full pagination support for all resources

4. **Authentication**: Email-based authentication. No OAuth or social login.

5. **Redis Usage**: Used for async task queue. Can be extended for caching.

6. **Scheduler**: Hourly syncs. Can be adjusted via cron expression in `backend/utils/scheduler.js`.

7. **Error Handling**: Graceful degradation - sync failures don't block tenant creation.

8. **Webhooks**: Optional feature. Requires Shopify app setup with webhook endpoints.

## 📝 Shopify Store Setup Guide

1. **Create Development Store**:
   - Go to https://partners.shopify.com
   - Create a partner account
   - Create a development store

2. **Generate Access Token**:
   - In your Shopify admin, go to Settings → Apps and sales channels
   - Click "Develop apps" → "Create an app"
   - Configure Admin API scopes (read_customers, read_orders, read_products)
   - Install app and copy the Admin API access token

3. **Add Test Data** (optional):
   - Add sample products
   - Create test orders
   - Add customer records

4. **Connect to Xeno**:
   - Use shop domain (e.g., `your-store.myshopify.com`)
   - Paste access token in onboarding form

## 🚀 Next Steps to Productionize

### 1. Security Enhancements
- [ ] Implement rate limiting (express-rate-limit)
- [ ] Add request validation (Joi/Zod)
- [ ] Enable HTTPS/TLS
- [ ] Add API key rotation for tenants
- [x] Implement proper webhook HMAC verification
- [x] Encrypt sensitive credentials at rest (access tokens, API keys, secrets)
- [ ] Add audit logging
- [ ] Implement CSRF protection
- [ ] Add input sanitization

### 2. Scalability
- [ ] Database connection pooling optimization
- [ ] Redis clustering for high availability
- [ ] Horizontal scaling with load balancer
- [ ] Database read replicas for analytics queries
- [ ] CDN for frontend assets
- [ ] Implement caching layer (Redis for frequently accessed data)
- [ ] Database sharding for multi-tenant data

### 3. Monitoring & Observability
- [ ] Application monitoring (New Relic, Datadog)
- [ ] Error tracking (Sentry)
- [ ] Log aggregation (ELK stack, CloudWatch)
- [ ] Health check endpoints (`/health`, `/ready`)
- [ ] Performance metrics dashboard
- [ ] Alerting for critical failures
- [ ] Distributed tracing

### 4. Data Management
- [ ] Implement data retention policies
- [ ] Add data export functionality (CSV, JSON)
- [ ] Backup and recovery procedures
- [ ] Data migration scripts
- [ ] Schema versioning
- [ ] Data archival for old records
- [ ] GDPR compliance features (data deletion, export)

### 5. Feature Enhancements
- [ ] Real-time dashboard updates (WebSockets)
- [ ] Advanced analytics (cohorts, LTV, churn)
- [ ] Custom report builder
- [ ] Email notifications for sync failures
- [ ] Multi-user access per tenant
- [ ] Role-based access control (RBAC)
- [ ] Scheduled reports
- [ ] Custom dashboards
- [ ] Data visualization enhancements

### 6. DevOps
- [ ] Docker containerization
- [ ] Kubernetes deployment manifests
- [ ] CI/CD pipeline (GitHub Actions, GitLab CI)
- [ ] Environment-specific configurations
- [ ] Automated testing (unit, integration, e2e)
- [ ] Infrastructure as Code (Terraform, CloudFormation)
- [ ] Blue-green deployment strategy
- [ ] Automated rollback procedures

### 7. Shopify Integration
- [ ] OAuth flow for app installation
- [ ] App Store listing
- [ ] Webhook subscription management
- [ ] GraphQL API migration for better performance
- [ ] Support for Shopify Plus features
- [ ] Multi-currency support
- [ ] Internationalization support

### 8. Performance Optimization
- [ ] Database query optimization
- [ ] Implement database indexes for common queries
- [ ] API response caching
- [ ] Frontend code splitting
- [ ] Lazy loading for dashboard components
- [ ] Optimize bundle sizes

## 🛠️ Troubleshooting

**MySQL Connection Error:**
- Verify MySQL is running: `mysql -u root -p`
- Check credentials in `.env`
- Ensure database exists

**Redis Connection Error:**
- Verify Redis is running: `redis-cli ping`
- Check `REDIS_URL` in `.env`
- Start Redis: `redis-server` or `brew services start redis`

**Port Already in Use:**
- Change `PORT` in `.env` for backend
- Change port in `vite.config.js` for frontend

**Module Not Found:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

**Shopify API Errors:**
- Verify access token is valid
- Check API permissions/scopes
- Ensure store domain is correct (include `.myshopify.com`)

## 📁 Project Structure

```
Xeno-FDE/
├── backend/
│   ├── controllers/
│   │   ├── authController.js          # Signup, signin, profile
│   │   ├── tenantController.js         # Store management
│   │   ├── ingestionController.js      # Data sync & webhooks
│   │   └── insightsController.js      # Dashboard analytics
│   ├── routes/
│   │   ├── auth.js                     # Auth routes
│   │   ├── tenants.js                  # Tenant routes
│   │   ├── ingestion.js                # Ingestion routes
│   │   └── insights.js                 # Insights routes
│   ├── services/
│   │   ├── ingestionService.js         # Shopify sync logic
│   │   └── webhookService.js           # Webhook processing
│   ├── utils/
│   │   ├── database.js                 # DB connection & schema
│   │   ├── auth.js                     # JWT & password hashing
│   │   ├── shopify.js                  # Shopify API client
│   │   ├── redis.js                    # Redis queue
│   │   ├── scheduler.js                # Cron scheduler
│   │   └── crypto.js                   # Encryption utilities
│   └── index.js                        # Express server
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx                # Landing page
│   │   │   ├── SignIn.jsx              # Login page
│   │   │   ├── SignUp.jsx              # Registration page
│   │   │   └── Dashboard.jsx           # Main dashboard
│   │   ├── components/
│   │   │   ├── Header.jsx              # Navigation header
│   │   │   └── Footer.jsx              # Footer component
│   │   ├── config/
│   │   │   └── api.js                  # API configuration
│   │   └── App.jsx                     # Router setup
│   └── package.json
├── package.json                         # Backend dependencies
├── env.example                          # Environment template
└── README.md                            # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

ISC

## 👤 Author

Built for Xeno FDE assignment

---

**Note**: This is a development/assignment project. For production use, implement the "Next Steps to Productionize" recommendations above.
