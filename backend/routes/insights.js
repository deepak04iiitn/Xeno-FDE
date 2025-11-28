import express from 'express';
import {
  getDashboardStats,
  getOrdersByDate,
  getTopCustomers,
  getRevenueTrends,
  getProductPerformance,
} from '../controllers/insightsController.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/:tenantId/dashboard', getDashboardStats);
router.get('/:tenantId/orders-by-date', getOrdersByDate);
router.get('/:tenantId/top-customers', getTopCustomers);
router.get('/:tenantId/revenue-trends', getRevenueTrends);
router.get('/:tenantId/products', getProductPerformance);

export default router;

