import express from 'express';
import { triggerSync, handleWebhook } from '../controllers/ingestionController.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

// Raw body middleware is already applied in index.js for /api/ingestion/webhook
router.post('/webhook', handleWebhook); // No auth for webhooks (uses HMAC)

router.post('/:tenantId/sync', authenticateToken, triggerSync);

export default router;

