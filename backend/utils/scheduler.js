import cron from 'node-cron';
import { getPool } from './database.js';
import { syncTenantData } from '../services/ingestionService.js';

export function startScheduler() {

  // Runs every hour to sync data for all active tenants
  cron.schedule('0 * * * *', async () => {

    console.log('🔄 Running scheduled data sync...');

    try {
      const db = getPool();
      const [tenants] = await db.execute(
        'SELECT id, shop_domain, access_token FROM tenants WHERE is_active = TRUE'
      );

      for(const tenant of tenants) {
        try {
          console.log(`Syncing data for tenant ${tenant.id} (${tenant.shop_domain})`);
          await syncTenantData(tenant.id, tenant.shop_domain, tenant.access_token);
          
          // Updating last_sync_at
          await db.execute(
            'UPDATE tenants SET last_sync_at = NOW() WHERE id = ?',
            [tenant.id]
          );
          
        } catch (error) {
          console.error(`Error syncing tenant ${tenant.id}:`, error.message);
        }
      }
      console.log('✅ Scheduled sync completed');
    } catch (error) {
      console.error('❌ Error in scheduled sync:', error);
    }
  });

  console.log('✅ Scheduler initialized - running hourly syncs');
}

