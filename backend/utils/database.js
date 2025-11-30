import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool;

// Connection configuration (for mysql.createConnection)
function getConnectionConfig(includeDatabase = true) {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    connectTimeout: 60000, // 60 seconds - valid for Connection
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  };

  // Add database if needed
  if (includeDatabase) {
    config.database = process.env.DB_NAME || 'xeno_fde';
  }

  // SSL configuration for cloud databases (like Render)
  if (process.env.DB_SSL === 'true' || process.env.DB_SSL === '1') {
    config.ssl = {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    };
  }

  return config;
}

// Pool configuration (for mysql.createPool)
function getPoolConfig() {
  const config = {
    ...getConnectionConfig(true),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000, // 60 seconds - valid for Pool
    timeout: 60000, // 60 seconds - valid for Pool
  };

  return config;
}

export function getPool() {
  if(!pool) {
    pool = mysql.createPool(getPoolConfig());
  }
  return pool;
}

export async function initializeDatabase() {
  const maxRetries = 5;
  const retryDelay = 5000; // 5 seconds

  // Retry logic for database connection
  let connection;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      connection = await mysql.createConnection(getConnectionConfig(false));
      console.log(`✅ Database connection established (attempt ${attempt}/${maxRetries})`);
      break;
    } catch (error) {
      console.error(`❌ Database connection attempt ${attempt}/${maxRetries} failed:`, error.message);
      if (attempt === maxRetries) {
        throw new Error(`Failed to connect to database after ${maxRetries} attempts: ${error.message}`);
      }
      console.log(`⏳ Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  try {
    // Create database if it doesn't exist
    // Use backticks to handle database names with hyphens or special characters
    const dbName = process.env.DB_NAME || 'xeno_fde';
    // Escape backticks in the database name and wrap in backticks
    const escapedDbName = '`' + dbName.replace(/`/g, '``') + '`';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${escapedDbName}`);
    await connection.end();
  } catch (error) {
    if (connection) {
      await connection.end();
    }
    throw error;
  }

  const db = getPool();

  // Create tables
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tenants (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      shop_domain VARCHAR(255) UNIQUE NOT NULL,
      shop_name VARCHAR(255),
      access_token TEXT,
      api_key VARCHAR(255),
      api_secret VARCHAR(255),
      webhook_secret VARCHAR(255),
      is_active BOOLEAN DEFAULT TRUE,
      last_sync_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_shop_domain (shop_domain)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS customers (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      tenant_id INT NOT NULL,
      shopify_customer_id BIGINT UNIQUE NOT NULL,
      email VARCHAR(255),
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      phone VARCHAR(50),
      total_spent DECIMAL(10, 2) DEFAULT 0,
      orders_count INT DEFAULT 0,
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      INDEX idx_tenant_id (tenant_id),
      INDEX idx_shopify_customer_id (shopify_customer_id),
      INDEX idx_email (email)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      tenant_id INT NOT NULL,
      shopify_product_id BIGINT UNIQUE NOT NULL,
      title VARCHAR(500),
      handle VARCHAR(255),
      vendor VARCHAR(255),
      product_type VARCHAR(255),
      status VARCHAR(50),
      total_inventory INT DEFAULT 0,
      price DECIMAL(10, 2),
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      INDEX idx_tenant_id (tenant_id),
      INDEX idx_shopify_product_id (shopify_product_id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      tenant_id INT NOT NULL,
      shopify_order_id BIGINT UNIQUE NOT NULL,
      order_number VARCHAR(50),
      customer_id BIGINT,
      email VARCHAR(255),
      financial_status VARCHAR(50),
      fulfillment_status VARCHAR(50),
      total_price DECIMAL(10, 2),
      subtotal_price DECIMAL(10, 2),
      total_tax DECIMAL(10, 2),
      total_discounts DECIMAL(10, 2),
      currency VARCHAR(10),
      order_date TIMESTAMP,
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      INDEX idx_tenant_id (tenant_id),
      INDEX idx_shopify_order_id (shopify_order_id),
      INDEX idx_customer_id (customer_id),
      INDEX idx_order_date (order_date),
      INDEX idx_email (email)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS custom_events (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      tenant_id INT NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      event_data JSON,
      customer_id BIGINT,
      order_id BIGINT,
      product_id BIGINT,
      occurred_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
      INDEX idx_tenant_id (tenant_id),
      INDEX idx_event_type (event_type),
      INDEX idx_occurred_at (occurred_at)
    )
  `);

  console.log('✅ Database tables created/verified');
}

