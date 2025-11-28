import { getPool } from '../utils/database.js';
import { ShopifyService } from '../utils/shopify.js';
import { syncTenantData } from '../services/ingestionService.js';
import { registerWebhooks } from '../services/webhookService.js';

export async function createTenant(req, res) {
  try {
    const { shopDomain, accessToken, shopName } = req.body;
    const userId = req.user.userId;

    if(!shopDomain || !accessToken) {
      return res.status(400).json({ error: 'Shop domain and access token are required' });
    }

    const db = getPool();

    // Verifying Shopify connection
    const shopify = new ShopifyService(shopDomain, accessToken);

    let shopInfo;
    try {
      shopInfo = await shopify.getShopInfo();
    } catch (error) {
      return res.status(400).json({ error: 'Invalid Shopify credentials or shop domain' });
    }

    // Checking if tenant already exists
    const [existingTenants] = await db.execute('SELECT id FROM tenants WHERE shop_domain = ?', [
      shopDomain,
    ]);

    if(existingTenants.length > 0) {
      return res.status(409).json({ error: 'This shop is already connected' });
    }

    // Creating tenant
    const [result] = await db.execute(
      `INSERT INTO tenants (user_id, shop_domain, shop_name, access_token, is_active)
       VALUES (?, ?, ?, ?, TRUE)`,
      [userId, shopDomain, shopName || shopInfo.name, accessToken]
    );

    // Triggerring initial data sync
    try {
      await syncTenantData(result.insertId, shopDomain, accessToken);
      await db.execute('UPDATE tenants SET last_sync_at = NOW() WHERE id = ?', [result.insertId]);
    } catch (syncError) {
      console.error('Initial sync error:', syncError);
      // Not failing tenant creation if sync fails
    }

    // Registering webhooks for real-time updates
    try {
      const webhookResult = await registerWebhooks(result.insertId, shopDomain, accessToken);
      console.log(`✅ Registered ${webhookResult.registered} webhooks for tenant ${result.insertId}`);
    } catch (webhookError) {
      console.error('Webhook registration error:', webhookError);
      // Not failing tenant creation if webhook registration fails
    }

    res.status(201).json({
      message: 'Tenant created and data sync initiated',
      tenant: {
        id: result.insertId,
        shop_domain: shopDomain,
        shop_name: shopName || shopInfo.name,
        is_active: true,
      },
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getTenants(req, res) {
  try {
    const userId = req.user.userId;
    const db = getPool();

    const [tenants] = await db.execute(
      `SELECT id, shop_domain, shop_name, is_active, last_sync_at, created_at
       FROM tenants WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ tenants });

  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getTenantById(req, res) {
  try {
    const userId = req.user.userId;
    const tenantId = req.params.id;
    const db = getPool();

    const [tenants] = await db.execute(
      `SELECT id, shop_domain, shop_name, is_active, last_sync_at, created_at
       FROM tenants WHERE id = ? AND user_id = ?`,
      [tenantId, userId]
    );

    if(tenants.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json({ tenant: tenants[0] });

  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function syncTenant(req, res) {
  try {
    const userId = req.user.userId;
    const tenantId = req.params.id;
    const db = getPool();

    // Verifying tenant belongs to user
    const [tenants] = await db.execute('SELECT * FROM tenants WHERE id = ? AND user_id = ?', [
      tenantId,
      userId,
    ]);

    if(tenants.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenant = tenants[0];

    // Triggerring sync (this will update existing records with ON DUPLICATE KEY UPDATE)
    await syncTenantData(tenant.id, tenant.shop_domain, tenant.access_token);
    await db.execute('UPDATE tenants SET last_sync_at = NOW() WHERE id = ?', [tenant.id]);

    res.json({ 
      message: 'Data sync completed successfully. Check server logs for details.',
      note: 'If customer names are still showing as N/A, check the server console for the Shopify API response structure.'
    });

  } catch (error) {
    console.error('Sync tenant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteTenant(req, res) {
  try {
    const userId = req.user.userId;
    const tenantId = req.params.id;
    const db = getPool();

    const [result] = await db.execute('DELETE FROM tenants WHERE id = ? AND user_id = ?', [
      tenantId,
      userId,
    ]);

    if(result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json({ message: 'Tenant deleted successfully' });
    
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

