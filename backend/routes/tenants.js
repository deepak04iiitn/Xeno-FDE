import express from 'express';
import {
  createTenant,
  getTenants,
  getTenantById,
  syncTenant,
  deleteTenant,
} from '../controllers/tenantController.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createTenant);
router.get('/', getTenants);
router.get('/:id', getTenantById);
router.post('/:id/sync', syncTenant);
router.delete('/:id', deleteTenant);

export default router;

