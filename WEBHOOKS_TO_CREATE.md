# Webhooks to Create Manually

## Webhook Signing Secret

From your Shopify admin, your webhook signing secret is:
```
c5889dce6f9f6fec5311eca0e0dd609f03aded168ba74cd09c6cd4c32f9980da
```

**Add this to your `.env` file:**
```env
SHOPIFY_WEBHOOK_SECRET=c5889dce6f9f6fec5311eca0e0dd609f03aded168ba74cd09c6cd4c32f9980da
```

## Webhook Base URL

Your webhook endpoint base URL depends on your setup:

### For Local Development (with ngrok):
```
https://your-ngrok-url.ngrok.io/api/ingestion/webhook
```

### For Production:
```
https://your-domain.com/api/ingestion/webhook
```

### For Local Testing (localhost - not recommended, use ngrok):
```
http://localhost:5000/api/ingestion/webhook
```

## Complete List of Webhooks to Create

Create these webhooks in Shopify Admin → Settings → Notifications → Webhooks:

### 1. Orders - Create
- **Event:** `orders/create`
- **Format:** JSON
- **URL:** `https://your-url.com/api/ingestion/webhook`

### 2. Orders - Update
- **Event:** `orders/update`
- **Format:** JSON
- **URL:** `https://your-url.com/api/ingestion/webhook`

### 3. Orders - Paid
- **Event:** `orders/paid`
- **Format:** JSON
- **URL:** `https://your-url.com/api/ingestion/webhook`

### 4. Orders - Cancelled
- **Event:** `orders/cancelled`
- **Format:** JSON
- **URL:** `https://your-url.com/api/ingestion/webhook`

### 5. Orders - Fulfilled
- **Event:** `orders/fulfilled`
- **Format:** JSON
- **URL:** `https://your-url.com/api/ingestion/webhook`

### 6. Customers - Create
- **Event:** `customers/create`
- **Format:** JSON
- **URL:** `https://your-url.com/api/ingestion/webhook`

### 7. Customers - Update
- **Event:** `customers/update`
- **Format:** JSON
- **URL:** `https://your-url.com/api/ingestion/webhook`

### 8. Customers - Delete
- **Event:** `customers/delete`
- **Format:** JSON
- **URL:** `https://your-url.com/api/ingestion/webhook`

### 9. Products - Create
- **Event:** `products/create`
- **Format:** JSON
- **URL:** `https://your-url.com/api/ingestion/webhook`

### 10. Products - Update
- **Event:** `products/update`
- **Format:** JSON
- **URL:** `https://your-url.com/api/ingestion/webhook`

### 11. Products - Delete
- **Event:** `products/delete`
- **Format:** JSON
- **URL:** `https://your-url.com/api/ingestion/webhook`

### 12. Checkouts - Create
- **Event:** `checkouts/create`
- **Format:** JSON
- **URL:** `https://your-url.com/api/ingestion/webhook`

### 13. Carts - Create
- **Event:** `carts/create`
- **Format:** JSON
- **URL:** `https://your-url.com/api/ingestion/webhook`

## Step-by-Step: How to Create Each Webhook

1. **Go to Shopify Admin:**
   - Settings → Notifications
   - Scroll to "Webhooks" section
   - Click "Create webhook"

2. **Fill in the form:**
   - **Event:** Select from dropdown (e.g., "Order creation")
   - **Format:** Select "JSON"
   - **URL:** Enter your webhook URL (see above)
   - Click "Save webhook"

3. **Repeat for all 11 webhooks listed above**

## Quick Reference Table

| Event | Shopify Event Name | URL |
|-------|-------------------|-----|
| Order created | `orders/create` | `https://your-url.com/api/ingestion/webhook` |
| Order updated | `orders/update` | `https://your-url.com/api/ingestion/webhook` |
| Order paid | `orders/paid` | `https://your-url.com/api/ingestion/webhook` |
| Order cancelled | `orders/cancelled` | `https://your-url.com/api/ingestion/webhook` |
| Order fulfilled | `orders/fulfilled` | `https://your-url.com/api/ingestion/webhook` |
| Customer created | `customers/create` | `https://your-url.com/api/ingestion/webhook` |
| Customer updated | `customers/update` | `https://your-url.com/api/ingestion/webhook` |
| Customer deleted | `customers/delete` | `https://your-url.com/api/ingestion/webhook` |
| Product created | `products/create` | `https://your-url.com/api/ingestion/webhook` |
| Product updated | `products/update` | `https://your-url.com/api/ingestion/webhook` |
| Product deleted | `products/delete` | `https://your-url.com/api/ingestion/webhook` |
| Checkout created | `checkouts/create` | `https://your-url.com/api/ingestion/webhook` |
| Cart created | `carts/create` | `https://your-url.com/api/ingestion/webhook` |

## For Local Development

### Step 1: Start ngrok
```bash
ngrok http 5000
```

### Step 2: Copy the HTTPS URL
You'll get something like: `https://abc123.ngrok.io`

### Step 3: Use this URL for all webhooks
```
https://abc123.ngrok.io/api/ingestion/webhook
```

### Step 4: Update .env
```env
WEBHOOK_BASE_URL=https://abc123.ngrok.io
SHOPIFY_WEBHOOK_SECRET=c5889dce6f9f6fec5311eca0e0dd609f03aded168ba74cd09c6cd4c32f9980da
```

### Step 5: Restart your server
```bash
npm run dev
```

## Verification

After creating webhooks:

1. **Check webhook list in Shopify:**
   - Settings → Notifications → Webhooks
   - You should see all 11 webhooks listed

2. **Test a webhook:**
   - Create a test order in your Shopify store
   - Check your server logs - you should see:
     ```
     📥 Webhook received: orders/create from your-store.myshopify.com
     ✅ Order webhook processed: #1001 for tenant 1
     ```

3. **Check your dashboard:**
   - The new order should appear immediately

## Important Notes

- ⚠️ **All webhooks use the SAME URL** - `/api/ingestion/webhook`
- ⚠️ **All webhooks must be JSON format**
- ⚠️ **For local dev, you MUST use ngrok or similar** - Shopify can't reach `localhost`
- ⚠️ **Webhook secret is the same for all webhooks** from the same store
- ✅ **The server automatically routes webhooks** based on the event type

## Troubleshooting

### Webhooks not being received?

1. **Check ngrok is running** (for local dev)
2. **Verify URL is correct** - must be HTTPS for production
3. **Check server logs** for errors
4. **Test webhook URL manually:**
   ```bash
   curl -X POST https://your-url.com/api/ingestion/webhook \
        -H "Content-Type: application/json" \
        -d '{"test": "data"}'
   ```

### Webhook registration failed?

The automatic registration might have failed. You can:
1. Create webhooks manually (as described above)
2. Or check server logs when connecting a store to see registration errors

## Summary

**Total Webhooks Needed:** 13

**All use the same URL:** `https://your-url.com/api/ingestion/webhook`

**Webhook Secret:** `c5889dce6f9f6fec5311eca0e0dd609f03aded168ba74cd09c6cd4c32f9980da`

Create each webhook manually in Shopify Admin, or the system will try to register them automatically when you connect/reconnect a store.

## Deletion Webhooks

The system now handles:
- **Customer deletion** - Removes customer from database when deleted in Shopify
- **Product deletion** - Removes product from database when deleted in Shopify

These ensure your database stays in sync when items are removed from Shopify.

