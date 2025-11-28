import { getPool } from '../utils/database.js';
import { ShopifyService } from '../utils/shopify.js';
import { enqueueIngestionTask } from '../utils/redis.js';

export async function syncTenantData(tenantId, shopDomain, accessToken) {

  const shopify = new ShopifyService(shopDomain, accessToken);
  const db = getPool();

  try {
    // Sync customers
    await syncCustomers(tenantId, shopify, db);
    
    // Sync products
    await syncProducts(tenantId, shopify, db);
    
    // Sync orders
    await syncOrders(tenantId, shopify, db);

    return { success: true, message: 'Data synced successfully' };

  } catch (error) {
    console.error(`Error syncing data for tenant ${tenantId}:`, error);
    throw error;
  }
}

async function syncCustomers(tenantId, shopify, db) {

  let pageInfo = null;
  let hasMore = true;
  let totalSynced = 0;

  while(hasMore) {
    const { customers, nextPageInfo } = await shopify.getCustomers(250, pageInfo);
    
    // Debug: Logging first customer to see structure
    if(customers.length > 0 && totalSynced === 0) {
      console.log('\n=== Shopify Customer API Response Sample ===');
      console.log('First customer from Shopify:', JSON.stringify(customers[0], null, 2));
      console.log('Customer keys:', Object.keys(customers[0]));
      console.log('===========================================\n');
    }
    
    for(const customer of customers) {
      // Enqueue for async processing
      await enqueueIngestionTask(tenantId, 'customer', customer);
      
      // Also process directly (for immediate sync)
      await processCustomer(tenantId, customer, db);
      totalSynced++;
    }

    pageInfo = nextPageInfo;
    hasMore = !!nextPageInfo;
  }

  console.log(`Synced ${totalSynced} customers for tenant ${tenantId}`);
}

async function processCustomer(tenantId, customerData, db) {
  try {
    // Extracting customer data - Shopify API may not return email/name due to Protected Customer Data
    // Trying multiple field name variations
    let email = customerData.email || customerData.Email || null;
    let firstName = customerData.first_name || customerData.firstName || customerData['first_name'] || null;
    let lastName = customerData.last_name || customerData.lastName || customerData['last_name'] || null;
    let phone = customerData.phone || customerData.Phone || null;
    
    // If email/name not in main object, trying extracting from addresses (if available)
    if((!email || !firstName || !lastName) && customerData.addresses && customerData.addresses.length > 0) {
      const defaultAddress = customerData.addresses.find(addr => addr.default) || customerData.addresses[0];

      if(defaultAddress) {
        email = email || defaultAddress.email || null;
        firstName = firstName || defaultAddress.first_name || defaultAddress.firstName || null;
        lastName = lastName || defaultAddress.last_name || defaultAddress.lastName || null;
        phone = phone || defaultAddress.phone || null;
      }
    }
    
    // Trying default_address if available
    if((!email || !firstName || !lastName) && customerData.default_address) {
      const addr = customerData.default_address;
      email = email || addr.email || null;
      firstName = firstName || addr.first_name || addr.firstName || null;
      lastName = lastName || addr.last_name || addr.lastName || null;
      phone = phone || addr.phone || null;
    }
    
    const totalSpent = customerData.total_spent || customerData.totalSpent || customerData['total_spent'] || 0;
    const ordersCount = customerData.orders_count || customerData.ordersCount || customerData['orders_count'] || 0;
    
    // Warn if protected customer data is missing
    if(!email && !firstName && !lastName) {
      console.warn(`⚠️  Customer ${customerData.id} has no email/name - Protected Customer Data may not be accessible. Check app permissions.`);
    }

    await db.execute(
      `INSERT INTO customers 
       (tenant_id, shopify_customer_id, email, first_name, last_name, phone, total_spent, orders_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       email = VALUES(email),
       first_name = VALUES(first_name),
       last_name = VALUES(last_name),
       phone = VALUES(phone),
       total_spent = VALUES(total_spent),
       orders_count = VALUES(orders_count),
       updated_at = VALUES(updated_at),
       synced_at = CURRENT_TIMESTAMP`,
      [
        tenantId,
        customerData.id,
        email,
        firstName,
        lastName,
        phone,
        parseFloat(totalSpent),
        parseInt(ordersCount),
        customerData.created_at || null,
        customerData.updated_at || null,
      ]
    );
  } catch (error) {
    console.error('Error processing customer:', error);
    console.error('Customer data that failed:', JSON.stringify(customerData, null, 2));
  }
}

async function syncProducts(tenantId, shopify, db) {
  let pageInfo = null;
  let hasMore = true;
  let totalSynced = 0;

  while(hasMore) {
    const { products, nextPageInfo } = await shopify.getProducts(250, pageInfo);
    
    for(const product of products) {
      await enqueueIngestionTask(tenantId, 'product', product);
      await processProduct(tenantId, product, db);
      totalSynced++;
    }

    pageInfo = nextPageInfo;
    hasMore = !!nextPageInfo;
  }

  console.log(`Synced ${totalSynced} products for tenant ${tenantId}`);
}

async function processProduct(tenantId, productData, db) {
  try {
    const variants = productData.variants || [];
    const firstVariant = variants[0] || {};
    const totalInventory = variants.reduce((sum, v) => sum + (parseInt(v.inventory_quantity) || 0), 0);

    await db.execute(
      `INSERT INTO products 
       (tenant_id, shopify_product_id, title, handle, vendor, product_type, status, total_inventory, price, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       title = VALUES(title),
       handle = VALUES(handle),
       vendor = VALUES(vendor),
       product_type = VALUES(product_type),
       status = VALUES(status),
       total_inventory = VALUES(total_inventory),
       price = VALUES(price),
       updated_at = VALUES(updated_at),
       synced_at = CURRENT_TIMESTAMP`,
      [
        tenantId,
        productData.id,
        productData.title || null,
        productData.handle || null,
        productData.vendor || null,
        productData.product_type || null,
        productData.status || null,
        totalInventory,
        parseFloat(firstVariant.price || 0),
        productData.created_at || null,
        productData.updated_at || null,
      ]
    );
  } catch (error) {
    console.error('Error processing product:', error);
  }
}

async function syncOrders(tenantId, shopify, db) {
  let pageInfo = null;
  let hasMore = true;
  let totalSynced = 0;
  let lastOrderId = null;

  // Getting the last synced order ID to avoid re-syncing old data
  const [lastOrder] = await db.execute(
    'SELECT shopify_order_id FROM orders WHERE tenant_id = ? ORDER BY shopify_order_id DESC LIMIT 1',
    [tenantId]
  );

  if(lastOrder.length > 0) {
    lastOrderId = lastOrder[0].shopify_order_id;
  }

  while(hasMore) {
    const { orders, nextPageInfo } = await shopify.getOrders(250, pageInfo, lastOrderId);
    
    for(const order of orders) {
      await enqueueIngestionTask(tenantId, 'order', order);
      await processOrder(tenantId, order, db);
      totalSynced++;
    }

    pageInfo = nextPageInfo;
    hasMore = !!nextPageInfo;
  }

  console.log(`Synced ${totalSynced} orders for tenant ${tenantId}`);
}

async function processOrder(tenantId, orderData, db) {
  try {
    // Finding customer by email or shopify customer id
    let customerId = null;

    if(orderData.customer) {
      const [customers] = await db.execute(
        'SELECT id FROM customers WHERE tenant_id = ? AND shopify_customer_id = ?',
        [tenantId, orderData.customer.id]
      );

      if(customers.length > 0) {
        customerId = customers[0].id;
      }
    }

    await db.execute(
      `INSERT INTO orders 
       (tenant_id, shopify_order_id, order_number, customer_id, email, financial_status, 
        fulfillment_status, total_price, subtotal_price, total_tax, total_discounts, 
        currency, order_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       order_number = VALUES(order_number),
       customer_id = VALUES(customer_id),
       email = VALUES(email),
       financial_status = VALUES(financial_status),
       fulfillment_status = VALUES(fulfillment_status),
       total_price = VALUES(total_price),
       subtotal_price = VALUES(subtotal_price),
       total_tax = VALUES(total_tax),
       total_discounts = VALUES(total_discounts),
       currency = VALUES(currency),
       order_date = VALUES(order_date),
       updated_at = VALUES(updated_at),
       synced_at = CURRENT_TIMESTAMP`,
      [
        tenantId,
        orderData.id,
        orderData.order_number?.toString() || null,
        customerId,
        orderData.email || null,
        orderData.financial_status || null,
        orderData.fulfillment_status || null,
        parseFloat(orderData.total_price || 0),
        parseFloat(orderData.subtotal_price || 0),
        parseFloat(orderData.total_tax || 0),
        parseFloat(orderData.total_discounts || 0),
        orderData.currency || null,
        orderData.created_at || null,
        orderData.created_at || null,
        orderData.updated_at || null,
      ]
    );
  } catch (error) {
    console.error('Error processing order:', error);
  }
}

export async function processCustomEvent(tenantId, eventType, eventData, db) {
  try {
    await db.execute(
      `INSERT INTO custom_events 
       (tenant_id, event_type, event_data, customer_id, order_id, product_id, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        eventType,
        JSON.stringify(eventData),
        eventData.customer_id || null,
        eventData.order_id || null,
        eventData.product_id || null,
        eventData.occurred_at || new Date(),
      ]
    );
  } catch (error) {
    console.error('Error processing custom event:', error);
    throw error;
  }
}

