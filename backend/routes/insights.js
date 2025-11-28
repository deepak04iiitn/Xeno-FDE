import express from 'express';
import {
  getDashboardStats,
  getOrdersByDate,
  getTopCustomers,
  getRevenueTrends,
  getProductPerformance,
  getOrderStatusDistribution,
  getRevenueByDayOfWeek,
  getCustomerAcquisition,
  getMonthlyRevenue,
  getOrderValueDistribution,
  getGrowthMetrics,
} from '../controllers/insightsController.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/:tenantId/dashboard', getDashboardStats);
router.get('/:tenantId/orders-by-date', getOrdersByDate);
router.get('/:tenantId/top-customers', getTopCustomers);
router.get('/:tenantId/revenue-trends', getRevenueTrends);
router.get('/:tenantId/products', getProductPerformance);
router.get('/:tenantId/order-status', getOrderStatusDistribution);
router.get('/:tenantId/revenue-by-day', getRevenueByDayOfWeek);
router.get('/:tenantId/customer-acquisition', getCustomerAcquisition);
router.get('/:tenantId/monthly-revenue', getMonthlyRevenue);
router.get('/:tenantId/order-value-distribution', getOrderValueDistribution);
router.get('/:tenantId/growth-metrics', getGrowthMetrics);

export default router;

