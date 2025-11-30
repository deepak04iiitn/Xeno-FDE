# Installation Guide

## Quick Start

### 1. Install All Dependencies

**From the root directory, run:**

```bash
npm install
cd frontend
npm install
cd ..
```

**Or use the build script (installs both root and frontend dependencies):**

```bash
npm run build
```

### 2. Required Dependencies Summary

**Backend (root package.json):**
- `express` - Web framework
- `mysql2` - MySQL database driver
- `redis` - Redis client for async queues
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `axios` - HTTP client for Shopify API
- `node-cron` - Scheduled tasks
- `cors` - CORS middleware
- `dotenv` - Environment variables
- `nodemon` - Development server

**Frontend (frontend/package.json):**
- `react` & `react-dom` - React framework
- `react-router-dom` - Routing
- `recharts` - Charting library
- `lucide-react` - Icons
- `tailwindcss` - CSS framework
- `vite` - Build tool

### 3. Environment Setup

1. Copy the example environment file:
```bash
cp env.example .env
```

2. Edit `.env` with your configuration:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=xeno_fde
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
```

### 4. Database Setup

Create the MySQL database:
```sql
CREATE DATABASE xeno_fde;
```

The application will automatically create all tables on first run.

### 5. Start Services

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Complete Installation Command

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

## Troubleshooting

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

## Render Deployment Guide

### Environment Variables for Render

When deploying to Render, set these environment variables in your Render dashboard:

**Required Variables:**
```env
PORT=10000
DB_HOST=your-database-host.render.com
DB_PORT=3306
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=xeno_fde
JWT_SECRET=your-secret-key-here
REDIS_URL=redis://your-redis-host:6379
```

**Optional Variables (for SSL):**
```env
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

### Important Notes for Render:

1. **Database Connection:**
   - Use the **Internal Database URL** from Render's database dashboard
   - If using Render's managed MySQL, the host will be something like `dpg-xxxxx-a.render.com`
   - Port is usually `3306` for MySQL
   - Enable SSL if your database requires it (`DB_SSL=true`)

2. **Connection Timeouts:**
   - The code now includes 60-second timeouts and retry logic
   - If you still get timeout errors, verify:
     - Database is accessible from Render's network
     - Database hostname is correct (use internal hostname if available)
     - Firewall rules allow connections from Render

3. **Database Creation:**
   - The app will automatically create the database if it doesn't exist
   - Ensure your database user has `CREATE DATABASE` privileges

4. **Build Command:**
   ```bash
   npm install && cd frontend && npm install && npm run build && cd ..
   ```

5. **Start Command:**
   ```bash
   npm start
   ```

### Troubleshooting Render Deployment:

**ETIMEDOUT Error:**
- Verify `DB_HOST` uses the internal database hostname (not external)
- Check that `DB_PORT` is set correctly (usually 3306)
- Ensure database is running and accessible
- Try enabling SSL: `DB_SSL=true`

**Connection Refused:**
- Verify database credentials are correct
- Check if database requires SSL connection
- Ensure database is in the same region as your web service (for internal networking)

