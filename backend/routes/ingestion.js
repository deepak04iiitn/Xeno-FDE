import express from 'express';
import { triggerSync, handleWebhook } from '../controllers/ingestionController.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook); // No auth for webhooks (uses HMAC)

router.post('/:tenantId/sync', authenticateToken, triggerSync);

export default router;

