# Shopify Webhooks Setup Guide

## Overview

Webhooks enable real-time data synchronization between Shopify and your application. When data changes in Shopify (new orders, customer updates, etc.), Shopify sends a webhook to your application immediately.

## How It Works

1. **Automatic Registration**: When you connect a store, webhooks are automatically registered
2. **Real-time Updates**: Shopify sends webhook events when data changes
3. **HMAC Verification**: Webhooks are verified using HMAC signatures for security
4. **Automatic Processing**: Data is automatically synced to your database

## Supported Webhook Events

The following webhook events are automatically registered:

### Orders
- `orders/create` - New order created
- `orders/update` - Order updated
- `orders/paid` - Order payment received
- `orders/cancelled` - Order cancelled
- `orders/fulfilled` - Order fulfilled

### Customers
- `customers/create` - New customer created
- `customers/update` - Customer updated

### Products
- `products/create` - New product created
- `products/update` - Product updated

### Custom Events
- `checkouts/create` - Checkout started (tracked as custom event)
- `carts/create` - Cart created (tracked as custom event)

## Configuration

### 1. Environment Variables

Add to your `.env` file:

```env
# Webhook Configuration
WEBHOOK_BASE_URL=https://your-domain.com
# Or for local development with ngrok:
# WEBHOOK_BASE_URL=https://your-ngrok-url.ngrok.io

# Webhook Secret (optional but recommended)
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_here
```

### 2. Webhook URL Format

Your webhook endpoint is:
```
https://your-domain.com/api/ingestion/webhook
```

### 3. Local Development Setup

For local development, you need to expose your local server:

#### Option A: Using ngrok (Recommended)

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   # or
   brew install ngrok
   ```

2. **Start your backend server:**
   ```bash
   npm run dev
   ```

3. **In another terminal, start ngrok:**
   ```bash
   ngrok http 5000
   ```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **Update .env:**
   ```env
   WEBHOOK_BASE_URL=https://abc123.ngrok.io
   ```

6. **Reconnect your store** to register webhooks with the new URL

#### Option B: Using localtunnel

```bash
npx localtunnel --port 5000
```

## Automatic Webhook Registration

When you connect a new store:

1. The system automatically registers all webhook events
2. Webhooks are registered with Shopify
3. You'll see confirmation in the server logs:
   ```
   ✅ Registered webhook: orders/create
   ✅ Registered webhook: customers/create
   ...
   ```

## Manual Webhook Management

### Check Registered Webhooks

You can check registered webhooks in Shopify Admin:

1. Go to **Settings** → **Notifications**
2. Scroll to **Webhooks** section
3. You'll see all registered webhooks with their URLs

### Delete Webhooks

If you need to delete webhooks:

1. Go to **Settings** → **Notifications** → **Webhooks**
2. Click on the webhook you want to delete
3. Click **Delete**

Or use the API (code example in `backend/services/webhookService.js`)

## Webhook Security (HMAC Verification)

### How It Works

1. Shopify signs each webhook with HMAC-SHA256
2. Your server verifies the signature using the webhook secret
3. Only verified webhooks are processed

### Setting Up HMAC Verification

1. **Get Webhook Secret from Shopify:**
   - Go to **Settings** → **Notifications** → **Webhooks**
   - Click on a webhook
   - Copy the **Webhook signing secret**

2. **Add to .env:**
   ```env
   SHOPIFY_WEBHOOK_SECRET=your_webhook_signing_secret_here
   ```

3. **Restart your server**

### Without HMAC Verification

If you don't set `SHOPIFY_WEBHOOK_SECRET`, webhooks will still work but won't be verified. This is fine for development but **not recommended for production**.

## Testing Webhooks

### Test with Shopify CLI (if using Shopify app)

```bash
shopify webhook trigger
```

### Manual Test

1. Create a test order in your Shopify store
2. Check your server logs - you should see:
   ```
   📥 Webhook received: orders/create from your-store.myshopify.com
   ✅ Order webhook processed: #1001 for tenant 1
   ```

3. Check your dashboard - the new order should appear immediately

## Troubleshooting

### Webhooks Not Received

1. **Check webhook URL is accessible:**
   - For local dev, ensure ngrok/localtunnel is running
   - Test the URL: `curl https://your-url.com/api/ingestion/webhook`

2. **Check webhook registration:**
   - Go to Shopify Admin → Settings → Notifications → Webhooks
   - Verify webhooks are registered with correct URL

3. **Check server logs:**
   - Look for webhook registration messages
   - Check for any errors

### Webhook Registration Fails

1. **Check access token permissions:**
   - Ensure token has `write_webhooks` scope (if required)
   - For private apps, webhooks should work with standard scopes

2. **Check WEBHOOK_BASE_URL:**
   - Must be a publicly accessible HTTPS URL
   - No trailing slash

3. **Check server logs for specific errors**

### HMAC Verification Fails

1. **Verify webhook secret matches:**
   - Check `.env` file has correct `SHOPIFY_WEBHOOK_SECRET`
   - Must match the secret in Shopify webhook settings

2. **Check webhook format:**
   - Shopify sends webhooks as JSON
   - Body must be parsed correctly

## Webhook Payload Structure

### Order Webhook
```json
{
  "order": {
    "id": 1234567890,
    "order_number": 1001,
    "email": "customer@example.com",
    "total_price": "100.00",
    "financial_status": "paid",
    ...
  }
}
```

### Customer Webhook
```json
{
  "customer": {
    "id": 9876543210,
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe",
    ...
  }
}
```

## Production Considerations

1. **Use HTTPS**: Webhooks require HTTPS in production
2. **Enable HMAC Verification**: Always verify webhook signatures
3. **Handle Failures**: Implement retry logic for failed webhook processing
4. **Rate Limiting**: Shopify may send many webhooks - ensure your server can handle the load
5. **Idempotency**: Webhooks may be sent multiple times - your code handles this with `ON DUPLICATE KEY UPDATE`

## Monitoring

Check your server logs for:
- `📥 Webhook received: [topic] from [shop]`
- `✅ [Type] webhook processed: [id] for tenant [id]`
- Any error messages

## Summary

✅ **Automatic**: Webhooks register automatically when you connect a store
✅ **Real-time**: Data syncs immediately when changes occur in Shopify
✅ **Secure**: HMAC verification ensures webhooks are from Shopify
✅ **Reliable**: Handles duplicates and errors gracefully

Your application now has real-time data synchronization! 🎉

