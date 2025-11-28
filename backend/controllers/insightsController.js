import { getPool } from '../utils/database.js';

export async function getDashboardStats(req, res) {
  try {
    const userId = req.user.userId;
    const tenantId = req.params.tenantId;
    const db = getPool();

    // Verifying tenant belongs to user
    const [tenants] = await db.execute('SELECT id FROM tenants WHERE id = ? AND user_id = ?', [
      tenantId,
      userId,
    ]);

    if(tenants.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Getting total customers
    const [customerStats] = await db.execute(
      'SELECT COUNT(*) as total FROM customers WHERE tenant_id = ?',
      [tenantId]
    );

    // Getting total orders and revenue
    const [orderStats] = await db.execute(
      `SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_price), 0) as total_revenue,
        COALESCE(AVG(total_price), 0) as avg_order_value
       FROM orders WHERE tenant_id = ?`,
      [tenantId]
    );

    // Getting total products
    const [productStats] = await db.execute(
      'SELECT COUNT(*) as total FROM products WHERE tenant_id = ?',
      [tenantId]
    );

    res.json({
      customers: {
        total: customerStats[0].total,
      },
      orders: {
        total: orderStats[0].total_orders,
        revenue: parseFloat(orderStats[0].total_revenue),
        avgOrderValue: parseFloat(orderStats[0].avg_order_value),
      },
      products: {
        total: productStats[0].total,
      },
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getOrdersByDate(req, res) {
  try {
    const userId = req.user.userId;
    const tenantId = req.params.tenantId;
    const { startDate, endDate } = req.query;
    const db = getPool();

    // Verifying tenant belongs to user
    const [tenants] = await db.execute('SELECT id FROM tenants WHERE id = ? AND user_id = ?', [
      tenantId,
      userId,
    ]);

    if(tenants.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    let query = `
      SELECT 
        DATE(order_date) as date,
        COUNT(*) as order_count,
        COALESCE(SUM(total_price), 0) as revenue
      FROM orders
      WHERE tenant_id = ?
    `;
    const params = [tenantId];

    if(startDate) {
      query += ' AND DATE(order_date) >= ?';
      params.push(startDate);
    }

    if(endDate) {
      query += ' AND DATE(order_date) <= ?';
      params.push(endDate);
    }

    query += ' GROUP BY DATE(order_date) ORDER BY date ASC';

    const [results] = await db.execute(query, params);

    res.json({
      ordersByDate: results.map((row) => ({
        date: row.date,
        orderCount: row.order_count,
        revenue: parseFloat(row.revenue),
      })),
    });

  } catch (error) {
    console.error('Get orders by date error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getTopCustomers(req, res) {
  try {
    const userId = req.user.userId;
    const tenantId = req.params.tenantId;
    const limit = parseInt(req.query.limit) || 5;
    const db = getPool();

    // Verifying tenant belongs to user
    const [tenants] = await db.execute('SELECT id FROM tenants WHERE id = ? AND user_id = ?', [
      tenantId,
      userId,
    ]);

    if(tenants.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const safeLimit = parseInt(limit) || 5;

    const [customers] = await db.execute(
      `SELECT 
        c.id,
        c.shopify_customer_id,
        c.email,
        c.first_name,
        c.last_name,
        c.total_spent,
        c.orders_count,
        COALESCE(SUM(o.total_price), 0) as calculated_spend
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE c.tenant_id = ?
      GROUP BY c.id
      ORDER BY calculated_spend DESC, c.total_spent DESC
      LIMIT ${safeLimit}`,
      [tenantId]
    );

    // Debug: Logging raw customer data
    if(process.env.NODE_ENV === 'development' && customers.length > 0) {
      console.log('\n=== Top Customers Raw Data ===');
      customers.forEach((c, i) => {
        console.log(`Customer ${i + 1}:`, {
          id: c.id,
          email: c.email,
          first_name: c.first_name,
          last_name: c.last_name,
          first_name_type: typeof c.first_name,
          last_name_type: typeof c.last_name,
        });
      });
    }

    res.json({
      topCustomers: customers.map((c) => {
        // Building customer identifier - using name if available, otherwise using ID
        // Note: Protected customer data (names, emails) requires Shopify Plus/Advanced plan
        let customerName = '';
        let customerIdentifier = '';
        
        // Checking if we have name parts (handle null, undefined, empty string)
        const firstName = c.first_name?.trim() || '';
        const lastName = c.last_name?.trim() || '';
        
        if(firstName || lastName) {
          // We have protected data (requires Plus/Advanced plan)
          customerName = `${firstName} ${lastName}`.trim();
          customerIdentifier = customerName;
        } else if (c.email) {
          // We have email (requires Plus/Advanced plan)
          customerIdentifier = c.email;
          customerName = c.email.split('@')[0]; // Username part for display
        } else {
          // No protected data available - use Shopify Customer ID
          // This is what's available on basic/development stores
          customerIdentifier = `Customer #${c.shopify_customer_id}`;
          customerName = `Customer #${c.shopify_customer_id}`;
        }
        
        return {
          id: c.id,
          shopifyCustomerId: c.shopify_customer_id,
          email: c.email || null,
          name: customerName,
          identifier: customerIdentifier,
          totalSpent: parseFloat(c.calculated_spend || c.total_spent || 0),
          ordersCount: c.orders_count || 0,
          hasProtectedData: !!(c.email || c.first_name || c.last_name),
        };
      }),
    });
  } catch (error) {
    console.error('Get top customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getRevenueTrends(req, res) {
  try {
    const userId = req.user.userId;
    const tenantId = req.params.tenantId;
    const { period = '30' } = req.query; // days
    const db = getPool();

    // Verifying tenant belongs to user
    const [tenants] = await db.execute('SELECT id FROM tenants WHERE id = ? AND user_id = ?', [
      tenantId,
      userId,
    ]);

    if(tenants.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const safePeriod = parseInt(period) || 30;

    const [trends] = await db.execute(
      `SELECT 
        DATE(order_date) as date,
        COUNT(*) as orders,
        COALESCE(SUM(total_price), 0) as revenue,
        COALESCE(AVG(total_price), 0) as avg_order_value
      FROM orders
      WHERE tenant_id = ? 
        AND order_date >= DATE_SUB(NOW(), INTERVAL ${safePeriod} DAY)
      GROUP BY DATE(order_date)
      ORDER BY date ASC`,
      [tenantId]
    );

    res.json({
      trends: trends.map((t) => ({
        date: t.date,
        orders: t.orders,
        revenue: parseFloat(t.revenue),
        avgOrderValue: parseFloat(t.avg_order_value),
      })),
    });

  } catch (error) {
    console.error('Get revenue trends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProductPerformance(req, res) {
  try {
    const userId = req.user.userId;
    const tenantId = req.params.tenantId;
    const limit = parseInt(req.query.limit) || 10;
    const db = getPool();

    // Verifying tenant belongs to user
    const [tenants] = await db.execute('SELECT id FROM tenants WHERE id = ? AND user_id = ?', [
      tenantId,
      userId,
    ]);

    if(tenants.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const safeLimit = parseInt(limit) || 10;

    const [products] = await db.execute(
      `SELECT 
        id,
        shopify_product_id,
        title,
        vendor,
        price,
        total_inventory,
        status
      FROM products
      WHERE tenant_id = ?
      ORDER BY price DESC
      LIMIT ${safeLimit}`,
      [tenantId]
    );

    res.json({
      products: products.map((p) => ({
        id: p.id,
        title: p.title,
        vendor: p.vendor,
        price: parseFloat(p.price || 0),
        inventory: p.total_inventory,
        status: p.status,
      })),
    });
    
  } catch (error) {
    console.error('Get product performance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

