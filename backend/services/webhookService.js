import axios from 'axios';
import { getPool } from '../utils/database.js';
import { encrypt } from '../utils/crypto.js';
import dotenv from 'dotenv';

dotenv.config();

const WEBHOOK_BASE_URL = process.env.WEBHOOK_BASE_URL;

export async function registerWebhooks(tenantId, shopDomain, accessToken) {
  const db = getPool();
  const baseURL = `https://${shopDomain}/admin/api/2025-10`;
  const headers = {
    'X-Shopify-Access-Token': accessToken,
    'Content-Type': 'application/json',
  };

  const webhookURL = `${WEBHOOK_BASE_URL}/api/ingestion/webhook`;

  // List of webhooks to register
  const webhooksToRegister = [
    { topic: 'orders/create', address: webhookURL },
    { topic: 'orders/update', address: webhookURL },
    { topic: 'orders/paid', address: webhookURL },
    { topic: 'orders/cancelled', address: webhookURL },
    { topic: 'orders/fulfilled', address: webhookURL },
    { topic: 'customers/create', address: webhookURL },
    { topic: 'customers/update', address: webhookURL },
    { topic: 'customers/delete', address: webhookURL },
    { topic: 'products/create', address: webhookURL },
    { topic: 'products/update', address: webhookURL },
    { topic: 'products/delete', address: webhookURL },
    { topic: 'checkouts/create', address: webhookURL },
    { topic: 'carts/create', address: webhookURL },
  ];

  const registeredWebhooks = [];

  try {
    // Firstly, getting existing webhooks to avoid duplicates
    const existingResponse = await axios.get(`${baseURL}/webhooks.json`, { headers });
    const existingWebhooks = existingResponse.data.webhooks || [];
    const existingTopics = new Set(existingWebhooks.map(wh => wh.topic));

    // Registering each webhook
    for(const webhook of webhooksToRegister) {
      // Skipping if it is already registered
      if(existingTopics.has(webhook.topic)) {
        console.log(`Webhook ${webhook.topic} already registered, skipping...`);
        continue;
      }

      try {
        const response = await axios.post(
          `${baseURL}/webhooks.json`,
          { webhook },
          { headers }
        );

        if(response.data.webhook) {
          registeredWebhooks.push(response.data.webhook);
          console.log(`✅ Registered webhook: ${webhook.topic}`);
        }
      } catch (error) {
        console.error(`Error registering webhook ${webhook.topic}:`, error.response?.data || error.message);
      }
    }

    // Storing webhook secret if provided - encrypt before storing
    if(process.env.SHOPIFY_WEBHOOK_SECRET) {
      const encryptedWebhookSecret = encrypt(process.env.SHOPIFY_WEBHOOK_SECRET);
      await db.execute(
        'UPDATE tenants SET webhook_secret = ? WHERE id = ?',
        [encryptedWebhookSecret, tenantId]
      );
    }

    return {
      success: true,
      registered: registeredWebhooks.length,
      webhooks: registeredWebhooks,
    };
  } catch (error) {
    console.error('Error registering webhooks:', error.response?.data || error.message);
    throw error;
  }
}

export async function listWebhooks(shopDomain, accessToken) {
  const baseURL = `https://${shopDomain}/admin/api/2025-10`;
  const headers = {
    'X-Shopify-Access-Token': accessToken,
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios.get(`${baseURL}/webhooks.json`, { headers });
    return response.data.webhooks || [];
  } catch (error) {
    console.error('Error listing webhooks:', error.response?.data || error.message);
    throw error;
  }
}

export async function deleteWebhook(shopDomain, accessToken, webhookId) {
  const baseURL = `https://${shopDomain}/admin/api/2025-10`;
  const headers = {
    'X-Shopify-Access-Token': accessToken,
  };

  try {
    await axios.delete(`${baseURL}/webhooks/${webhookId}.json`, { headers });
    console.log(`Deleted webhook: ${webhookId}`);
    return true;
  } catch (error) {
    console.error('Error deleting webhook:', error.response?.data || error.message);
    throw error;
  }
}

