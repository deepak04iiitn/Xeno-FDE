# Xeno FDE - Multi-Tenant Shopify Data Ingestion & Insights Service

A comprehensive multi-tenant platform for ingesting, storing, and analyzing Shopify store data. This service enables enterprise retailers to onboard multiple Shopify stores, sync customer/order/product data, and visualize business insights through an intuitive dashboard.

## 🏗️ Architecture

### High-Level Architecture

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

### 3. Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE xeno_fde;
```

2. Update `.env` file with your database credentials (see `.env.example`)

3. The application will automatically create all required tables on first run.

### 4. Redis Setup

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

### 5. Environment Configuration

Copy `.env.example` to `.env` and update with your values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Database credentials
- JWT secret (use a strong random string)
- Redis URL (if different from default)
- **SHOPIFY_CLIENT_SECRET** - Your Shopify app's API Secret Key (required for webhook HMAC verification)
  - Format: `shpss_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
  - Found in: Shopify Partner Dashboard → Your App → API credentials → API secret key

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

## 📚 API Endpoints

### Authentication

- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Sign in user
- `GET /api/auth/profile` - Get user profile (requires auth)

### Tenants (Stores)

- `POST /api/tenants` - Connect a new Shopify store
- `GET /api/tenants` - List all connected stores
- `GET /api/tenants/:id` - Get store details
- `POST /api/tenants/:id/sync` - Trigger manual data sync
- `DELETE /api/tenants/:id` - Disconnect a store

### Data Ingestion

- `POST /api/ingestion/:tenantId/sync` - Trigger sync for a tenant
- `POST /api/ingestion/webhook` - Shopify webhook endpoint

### Insights

- `GET /api/insights/:tenantId/dashboard` - Get dashboard statistics
- `GET /api/insights/:tenantId/orders-by-date` - Get orders grouped by date
- `GET /api/insights/:tenantId/top-customers` - Get top customers by spend
- `GET /api/insights/:tenantId/revenue-trends` - Get revenue trends over time
- `GET /api/insights/:tenantId/products` - Get product performance data

## 🗄️ Database Schema

### Core Tables

**users**
- `id` (INT, PK)
- `email` (VARCHAR, UNIQUE)
- `password_hash` (VARCHAR)
- `name` (VARCHAR)
- `created_at`, `updated_at` (TIMESTAMP)

**tenants**
- `id` (INT, PK)
- `user_id` (INT, FK → users)
- `shop_domain` (VARCHAR, UNIQUE)
- `shop_name` (VARCHAR)
- `access_token` (TEXT)
- `is_active` (BOOLEAN)
- `last_sync_at` (TIMESTAMP)
- `created_at`, `updated_at` (TIMESTAMP)

**customers**
- `id` (BIGINT, PK)
- `tenant_id` (INT, FK → tenants)
- `shopify_customer_id` (BIGINT, UNIQUE)
- `email`, `first_name`, `last_name`, `phone` (VARCHAR)
- `total_spent` (DECIMAL)
- `orders_count` (INT)
- `created_at`, `updated_at`, `synced_at` (TIMESTAMP)

**orders**
- `id` (BIGINT, PK)
- `tenant_id` (INT, FK → tenants)
- `shopify_order_id` (BIGINT, UNIQUE)
- `order_number` (VARCHAR)
- `customer_id` (BIGINT, FK → customers)
- `email` (VARCHAR)
- `financial_status`, `fulfillment_status` (VARCHAR)
- `total_price`, `subtotal_price`, `total_tax`, `total_discounts` (DECIMAL)
- `currency` (VARCHAR)
- `order_date`, `created_at`, `updated_at`, `synced_at` (TIMESTAMP)

**products**
- `id` (BIGINT, PK)
- `tenant_id` (INT, FK → tenants)
- `shopify_product_id` (BIGINT, UNIQUE)
- `title`, `handle`, `vendor`, `product_type`, `status` (VARCHAR)
- `total_inventory` (INT)
- `price` (DECIMAL)
- `created_at`, `updated_at`, `synced_at` (TIMESTAMP)

**custom_events**
- `id` (BIGINT, PK)
- `tenant_id` (INT, FK → tenants)
- `event_type` (VARCHAR) - e.g., 'checkout_started', 'cart_abandoned'
- `event_data` (JSON)
- `customer_id`, `order_id`, `product_id` (BIGINT, FK)
- `occurred_at`, `created_at` (TIMESTAMP)

## 🔐 Authentication & Security

- **JWT-based authentication** for API access
- **Bcrypt password hashing** (10 rounds)
- **Multi-tenant data isolation** via `tenant_id` foreign keys
- **Token expiration** (configurable, default 7 days)
- **CORS enabled** for frontend-backend communication

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

## 🎯 Assumptions & Design Decisions

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

## 🚧 Known Limitations

1. **Order Line Items**: Product-order relationships not fully tracked (simplified schema).

2. **Rate Limiting**: No Shopify API rate limiting implemented. May need throttling for high-volume stores.

3. **Webhook Security**: ✅ HMAC verification implemented using `SHOPIFY_CLIENT_SECRET`. Ensure your `.env` file contains the correct API Secret Key from your Shopify app.

4. **Data Retention**: No automatic cleanup of old data.

5. **Concurrent Syncs**: Multiple simultaneous syncs for same tenant not prevented.

6. **Error Recovery**: Failed sync tasks not automatically retried.

7. **Analytics**: Basic metrics only. Advanced cohort analysis, LTV calculations not included.

## 🚀 Next Steps to Productionize

### 1. Security Enhancements
- [ ] Implement rate limiting (express-rate-limit)
- [ ] Add request validation (Joi/Zod)
- [ ] Enable HTTPS/TLS
- [ ] Add API key rotation for tenants
- [x] Implement proper webhook HMAC verification
- [ ] Add audit logging

### 2. Scalability
- [ ] Database connection pooling optimization
- [ ] Redis clustering for high availability
- [ ] Horizontal scaling with load balancer
- [ ] Database read replicas for analytics queries
- [ ] CDN for frontend assets

### 3. Monitoring & Observability
- [ ] Application monitoring (New Relic, Datadog)
- [ ] Error tracking (Sentry)
- [ ] Log aggregation (ELK stack, CloudWatch)
- [ ] Health check endpoints
- [ ] Performance metrics dashboard

### 4. Data Management
- [ ] Implement data retention policies
- [ ] Add data export functionality
- [ ] Backup and recovery procedures
- [ ] Data migration scripts
- [ ] Schema versioning

### 5. Feature Enhancements
- [ ] Real-time dashboard updates (WebSockets)
- [ ] Advanced analytics (cohorts, LTV, churn)
- [ ] Custom report builder
- [ ] Email notifications for sync failures
- [ ] Multi-user access per tenant
- [ ] Role-based access control (RBAC)

### 6. DevOps
- [ ] Docker containerization
- [ ] Kubernetes deployment manifests
- [ ] CI/CD pipeline (GitHub Actions, GitLab CI)
- [ ] Environment-specific configurations
- [ ] Automated testing (unit, integration, e2e)

### 7. Shopify Integration
- [ ] OAuth flow for app installation
- [ ] App Store listing
- [ ] Webhook subscription management
- [ ] GraphQL API migration for better performance
- [ ] Support for Shopify Plus features

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

