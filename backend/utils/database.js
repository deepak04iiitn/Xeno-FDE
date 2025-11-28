import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool;

export function getPool() {
  if(!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'xeno_fde',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

export async function initializeDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
  });

  // Create database if it doesn't exist
  await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'xeno_fde'}`);
  await connection.end();

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

