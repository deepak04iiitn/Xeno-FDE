import express from 'express';
import { triggerSync, handleWebhook } from '../controllers/ingestionController.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

router.post('/:tenantId/sync', authenticateToken, triggerSync);
router.post('/webhook', handleWebhook); // No auth for webhooks (uses HMAC)

export default router;

