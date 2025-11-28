import { getPool } from '../utils/database.js';
import { syncTenantData } from '../services/ingestionService.js';
import { processCustomEvent } from '../services/ingestionService.js';

export async function triggerSync(req, res) {
  try {
    const userId = req.user.userId;
    const tenantId = req.params.tenantId;
    const db = getPool();

    // Verify tenant belongs to user
    const [tenants] = await db.execute('SELECT * FROM tenants WHERE id = ? AND user_id = ?', [
      tenantId,
      userId,
    ]);

    if (tenants.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenant = tenants[0];

    // Trigger async sync
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

    if (!shopDomain || !topic) {
      return res.status(400).json({ error: 'Missing required headers' });
    }

    const db = getPool();

    // Find tenant by shop domain
    const [tenants] = await db.execute('SELECT * FROM tenants WHERE shop_domain = ?', [shopDomain]);
    if (tenants.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenant = tenants[0];

    // Handle different webhook topics
    switch (topic) {
      case 'orders/create':
      case 'orders/update':
        // Process order webhook
        await processOrderWebhook(tenant.id, req.body, db);
        break;
      case 'customers/create':
      case 'customers/update':
        // Process customer webhook
        await processCustomerWebhook(tenant.id, req.body, db);
        break;
      case 'products/create':
      case 'products/update':
        // Process product webhook
        await processProductWebhook(tenant.id, req.body, db);
        break;
      case 'checkouts/create':
        // Custom event: checkout started
        await processCustomEvent(tenant.id, 'checkout_started', {
          checkout_data: req.body,
          occurred_at: new Date(),
        }, db);
        break;
      default:
        console.log(`Unhandled webhook topic: ${topic}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function processOrderWebhook(tenantId, orderData, db) {
  // Similar to processOrder in ingestionService
  // Implementation would go here
  console.log(`Processing order webhook for tenant ${tenantId}`);
}

async function processCustomerWebhook(tenantId, customerData, db) {
  // Similar to processCustomer in ingestionService
  console.log(`Processing customer webhook for tenant ${tenantId}`);
}

async function processProductWebhook(tenantId, productData, db) {
  // Similar to processProduct in ingestionService
  console.log(`Processing product webhook for tenant ${tenantId}`);
}

