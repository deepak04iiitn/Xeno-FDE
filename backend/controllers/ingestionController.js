import { getPool } from '../utils/database.js';
import { syncTenantData, processCustomEvent, processCustomer, processOrder, processProduct } from '../services/ingestionService.js';
import crypto from 'crypto';

export async function triggerSync(req, res) {
  try {
    const userId = req.user.userId;
    const tenantId = req.params.tenantId;
    const db = getPool();

    // Verifying that tenant belongs to user
    const [tenants] = await db.execute('SELECT * FROM tenants WHERE id = ? AND user_id = ?', [
      tenantId,
      userId,
    ]);

    if(tenants.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenant = tenants[0];

    // Triggerring async sync
    syncTenantData(tenant.id, tenant.shop_domain, tenant.access_token)
      .then(async () => {
        await db.execute('UPDATE tenants SET last_sync_at = NOW() WHERE id = ?', [tenant.id]);
      })
      .catch((error) => {
        console.error('Background sync error:', error);
      });

    res.json({ message: 'Data sync initiated. It will run in the background.' });

  } catch (error) {
    console.error('Trigger sync error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function handleWebhook(req, res) {
  try {
    const shopDomain = req.headers['x-shopify-shop-domain'];
    const hmac = req.headers['x-shopify-hmac-sha256'];
    const topic = req.headers['x-shopify-topic'];

    if(!shopDomain || !topic) {
      return res.status(400).json({ error: 'Missing required headers' });
    }

    // HMAC verification MUST happen first, before any processing
    // Shopify requires the exact raw body as received for HMAC calculation
    // For Admin API webhooks: use SHOPIFY_CLIENT_SECRET (API Secret Key)
    // For Partner Dashboard webhooks: use SHOPIFY_WEBHOOK_SECRET
    const appClientSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
    
    if(appClientSecret) {
      if(!hmac) {
        console.error('❌ Webhook HMAC verification failed: Missing HMAC header');
        return res.status(401).json({ error: 'Missing webhook signature' });
      }

      // req.body is a Buffer when using express.raw({ type: '*/*' })
      if(!req.body || !Buffer.isBuffer(req.body)) {
        console.error('❌ Webhook HMAC verification failed: Raw body not available');
        console.error('Body type:', typeof req.body);
        console.error('Is Buffer:', Buffer.isBuffer(req.body));
        return res.status(401).json({ error: 'Cannot verify webhook signature - raw body not available' });
      }
      
      // Debug logging (only show first 4 chars of secret for security)
      const secretSource = process.env.SHOPIFY_CLIENT_SECRET ? 'SHOPIFY_CLIENT_SECRET' : 'SHOPIFY_WEBHOOK_SECRET';
      console.log(`🔐 Using secret from: ${secretSource} (${appClientSecret.substring(0, 6)}...)`);
      console.log(`📦 Raw body length: ${req.body.length} bytes`);
      console.log(`📦 Raw body preview: ${req.body.toString('utf8').substring(0, 100)}...`);
      console.log(`🔑 Received HMAC: ${hmac}`);
      
      // Calculate HMAC using the raw body buffer (as per Shopify documentation)
      const calculatedHmacDigest = crypto
        .createHmac('sha256', appClientSecret)
        .update(req.body)
        .digest('base64');

      console.log(`🔑 Calculated HMAC: ${calculatedHmacDigest}`);

      // HMAC verification as per Shopify official documentation
      const hmacValid = crypto.timingSafeEqual(
        Buffer.from(calculatedHmacDigest, 'base64'),
        Buffer.from(hmac, 'base64')
      );
      
      if(!hmacValid) {
        console.error('❌ Webhook HMAC verification failed');
        console.error(`   Expected: ${hmac}`);
        console.error(`   Calculated: ${calculatedHmacDigest}`);
        console.error(`   Secret source: ${secretSource}`);
        console.error(`   Body length: ${req.body.length} bytes`);
        console.error('💡 Tip: Verify that SHOPIFY_CLIENT_SECRET in .env matches your Shopify app\'s API Secret Key');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
      
      console.log('✅ Webhook HMAC verification passed');
    } else if(hmac) {
      // HMAC header present but no secret configured - warn but don't fail
      console.warn('⚠️  Webhook HMAC header present but SHOPIFY_CLIENT_SECRET or SHOPIFY_WEBHOOK_SECRET not configured');
      console.warn('💡 Set SHOPIFY_CLIENT_SECRET in .env to enable webhook verification');
    }

    const db = getPool();

    // Finding tenant by shop domain
    const [tenants] = await db.execute('SELECT * FROM tenants WHERE shop_domain = ?', [shopDomain]);

    if(tenants.length === 0) {
      console.warn(`Webhook received for unknown shop: ${shopDomain}`);
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenant = tenants[0];

    // Parse the raw body buffer to JSON (req.body is a Buffer when using express.raw())
    let webhookData;
    try {
      webhookData = JSON.parse(req.body.toString('utf8'));
    } catch (error) {
      console.error('Error parsing webhook body:', error);
      return res.status(400).json({ error: 'Invalid JSON in webhook body' });
    }

    console.log(`📥 Webhook received: ${topic} from ${shopDomain}`);

    // Handling different webhook topics
    switch(topic) {
      case 'orders/create':
      case 'orders/update':
        await processOrderWebhook(tenant.id, webhookData, db);
        break;
      case 'orders/paid':
      case 'orders/cancelled':
      case 'orders/fulfilled':
        await processOrderWebhook(tenant.id, webhookData, db);
        break;
      case 'customers/create':
      case 'customers/update':
        await processCustomerWebhook(tenant.id, webhookData, db);
        break;
      case 'customers/delete':
        await processCustomerDeleteWebhook(tenant.id, webhookData, db);
        break;
      case 'products/create':
      case 'products/update':
        await processProductWebhook(tenant.id, webhookData, db);
        break;
      case 'products/delete':
        await processProductDeleteWebhook(tenant.id, webhookData, db);
        break;
      case 'checkouts/create':
        await processCustomEvent(tenant.id, 'checkout_started', {
          checkout_data: webhookData,
          occurred_at: new Date(),
        }, db);
        break;
      case 'carts/create':
        await processCustomEvent(tenant.id, 'cart_created', {
          cart_data: webhookData,
          occurred_at: new Date(),
        }, db);
        break;
      default:
        console.log(`⚠️  Unhandled webhook topic: ${topic}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function processOrderWebhook(tenantId, orderData, db) {
  try {
    // Extracting order from webhook payload (Shopify sends { order: {...} } format)
    const order = orderData.order || orderData;
    
    // Using the existing processOrder function
    await processOrder(tenantId, order, db);
    console.log(`Order webhook processed: ${order.order_number || order.id} for tenant ${tenantId}`);

  } catch (error) {
    console.error('Error processing order webhook:', error);
    throw error;
  }
}

async function processCustomerWebhook(tenantId, customerData, db) {
  try {
    // Extracting the customer from webhook payload
    const customer = customerData.customer || customerData;
    
    // Using the existing processCustomer function
    await processCustomer(tenantId, customer, db);
    console.log(`Customer webhook processed: ${customer.id} for tenant ${tenantId}`);

  } catch (error) {
    console.error('Error processing customer webhook:', error);
    throw error;
  }
}

async function processProductWebhook(tenantId, productData, db) {
  try {
    // Extracting product from webhook payload
    const product = productData.product || productData;
    
    // Using the existing processProduct function
    await processProduct(tenantId, product, db);
    console.log(`Product webhook processed: ${product.id} for tenant ${tenantId}`);

  } catch (error) {
    console.error('Error processing product webhook:', error);
    throw error;
  }
}

async function processCustomerDeleteWebhook(tenantId, customerData, db) {
  try {
    // Extracting customer ID from webhook payload
    // Shopify sends { id: customer_id } for delete events
    const customerId = customerData.id || (customerData.customer && customerData.customer.id);
    
    if(!customerId) {
      console.warn('Customer delete webhook: No customer ID found');
      return;
    }

    // Deleting customer from database
    const [result] = await db.execute(
      'DELETE FROM customers WHERE tenant_id = ? AND shopify_customer_id = ?',
      [tenantId, customerId]
    );

    if(result.affectedRows > 0) {
      console.log(`Customer deleted: ${customerId} for tenant ${tenantId}`);
    } else {
      console.log(`Customer not found for deletion: ${customerId} for tenant ${tenantId}`);
    }
  } catch (error) {
    console.error('Error processing customer delete webhook:', error);
    throw error;
  }
}

async function processProductDeleteWebhook(tenantId, productData, db) {
  try {
    // Extracting product ID from webhook payload
    // Shopify sends { id: product_id } for delete events
    const productId = productData.id || (productData.product && productData.product.id);
    
    if(!productId) {
      console.warn('Product delete webhook: No product ID found');
      return;
    }

    // Deleting product from database
    const [result] = await db.execute(
      'DELETE FROM products WHERE tenant_id = ? AND shopify_product_id = ?',
      [tenantId, productId]
    );

    if(result.affectedRows > 0) {
      console.log(`Product deleted: ${productId} for tenant ${tenantId}`);
    } else {
      console.log(`Product not found for deletion: ${productId} for tenant ${tenantId}`);
    }
  } catch (error) {
    console.error('Error processing product delete webhook:', error);
    throw error;
  }
}

