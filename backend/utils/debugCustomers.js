import { getPool } from './database.js';

export async function debugCustomers(tenantId) {
  const db = getPool();
  
  try {
    const [customers] = await db.execute(
      `SELECT 
        id,
        shopify_customer_id,
        email,
        first_name,
        last_name,
        total_spent,
        orders_count
      FROM customers
      WHERE tenant_id = ?
      LIMIT 10`,
      [tenantId]
    );

    console.log('\n=== Customer Data in Database ===');
    console.log(`Total customers found: ${customers.length}`);
    customers.forEach((c, index) => {
      console.log(`\nCustomer ${index + 1}:`);
      console.log(`  ID: ${c.id}`);
      console.log(`  Shopify ID: ${c.shopify_customer_id}`);
      console.log(`  Email: ${c.email || 'NULL'}`);
      console.log(`  First Name: ${c.first_name || 'NULL'}`);
      console.log(`  Last Name: ${c.last_name || 'NULL'}`);
      console.log(`  Full Name: "${(c.first_name || '')} ${c.last_name || ''}".trim() = "${`${c.first_name || ''} ${c.last_name || ''}`.trim()}"`);
      console.log(`  Total Spent: ${c.total_spent}`);
      console.log(`  Orders Count: ${c.orders_count}`);
    });
    console.log('\n================================\n');
    
    return customers;
  } catch (error) {
    console.error('Error debugging customers:', error);
    throw error;
  }
}

