import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  ShoppingBag,
  DollarSign,
  Package,
  TrendingUp,
  RefreshCw,
  Plus,
  LogOut,
} from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [stats, setStats] = useState(null);
  const [ordersByDate, setOrdersByDate] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardData, setOnboardData] = useState({
    shopDomain: '',
    accessToken: '',
    shopName: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if(!token || !userData) {
      navigate('/sign-in');
      return;
    }

    setUser(JSON.parse(userData));
    fetchTenants();
  }, [navigate]);

  useEffect(() => {
    if(selectedTenant) {
      fetchDashboardData();
    }
  }, [selectedTenant]);

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tenants', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if(response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/sign-in');
        return;
      }

      const data = await response.json();
      setTenants(data.tenants || []);

      if(data.tenants && data.tenants.length > 0 && !selectedTenant) {
        setSelectedTenant(data.tenants[0].id);
      }

    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {

    if(!selectedTenant) return;

    try {
      const token = localStorage.getItem('token');
      const [statsRes, ordersRes, customersRes, trendsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/insights/${selectedTenant}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://localhost:5000/api/insights/${selectedTenant}/orders-by-date`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://localhost:5000/api/insights/${selectedTenant}/top-customers?limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://localhost:5000/api/insights/${selectedTenant}/revenue-trends?period=30`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [statsData, ordersData, customersData, trendsData] = await Promise.all([
        statsRes.json(),
        ordersRes.json(),
        customersRes.json(),
        trendsRes.json(),
      ]);

      setStats(statsData);
      setOrdersByDate(ordersData.ordersByDate || []);
      setTopCustomers(customersData.topCustomers || []);
      setRevenueTrends(trendsData.trends || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleSync = async () => {
    if(!selectedTenant) return;

    setSyncing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/ingestion/${selectedTenant}/sync`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if(response.ok) {
        setTimeout(() => {
          fetchDashboardData();
          setSyncing(false);
        }, 2000);
      } else {
        setSyncing(false);
      }

    } catch (error) {
      console.error('Error syncing:', error);
      setSyncing(false);
    }
  };

  const handleOnboard = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(onboardData),
      });

      const data = await response.json();

      if(!response.ok) {
        throw new Error(data.error || 'Failed to onboard tenant');
      }

      setShowOnboardModal(false);
      setOnboardData({ shopDomain: '', accessToken: '', shopName: '' });
      fetchTenants();

    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/sign-in');
  };

  if(loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">

            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Xeno Dashboard</h1>
              {user && <p className="text-sm text-slate-600">{user.email}</p>}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowOnboardModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="h-4 w-4" />
                Connect Store
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>

          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Tenant Selector */}
        {tenants.length > 0 && (
          <div className="mb-6 flex items-center gap-4">

            <label className="text-sm font-medium text-slate-700">Select Store:</label>

            <select
              value={selectedTenant || ''}
              onChange={(e) => setSelectedTenant(parseInt(e.target.value))}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.shop_name || tenant.shop_domain}
                </option>
              ))}
            </select>

            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            
          </div>
        )}

        {tenants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 mb-4">No stores connected yet.</p>
            <button
              onClick={() => setShowOnboardModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="h-5 w-5" />
              Connect Your First Store
            </button>
          </div>
        ) : selectedTenant && stats ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-600">Total Customers</h3>
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <p className="text-3xl font-semibold text-slate-900">{stats.customers.total}</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-600">Total Orders</h3>
                  <ShoppingBag className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-3xl font-semibold text-slate-900">{stats.orders.total}</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-600">Total Revenue</h3>
                  <DollarSign className="h-5 w-5 text-sky-600" />
                </div>
                <p className="text-3xl font-semibold text-slate-900">
                  ${stats.orders.revenue.toFixed(2)}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-600">Avg Order Value</h3>
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-3xl font-semibold text-slate-900">
                  ${stats.orders.avgOrderValue.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#6366f1" name="Revenue ($)" />
                    <Line
                      type="monotone"
                      dataKey="avgOrderValue"
                      stroke="#10b981"
                      name="Avg Order Value ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Orders by Date</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ordersByDate}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="orderCount" fill="#6366f1" name="Orders" />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Customers */}
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Top 5 Customers</h3>
                {topCustomers.length > 0 && !topCustomers[0]?.hasProtectedData && (
                  <span className="text-xs text-slate-500 italic">
                    Customer names/emails require Shopify Plus/Advanced plan
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">
                        Customer
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-700">
                        Total Spent
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-700">
                        Orders
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="py-8 text-center text-slate-500">
                          No customer data available yet
                        </td>
                      </tr>
                    ) : (
                      topCustomers.map((customer) => (
                        <tr key={customer.id} className="border-b border-slate-100">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-slate-900">
                                {customer.name || customer.identifier || `Customer #${customer.shopifyCustomerId || customer.id}`}
                              </p>
                              {customer.email ? (
                                <p className="text-sm text-slate-600">{customer.email}</p>
                              ) : customer.shopifyCustomerId ? (
                                <p className="text-xs text-slate-500">
                                  Shopify ID: {customer.shopifyCustomerId}
                                </p>
                              ) : null}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-900">
                            ${customer.totalSpent.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600">
                            {customer.ordersCount}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-600">Loading dashboard data...</p>
          </div>
        )}
      </div>

      {/* Onboard Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Connect Shopify Store</h2>
            <form onSubmit={handleOnboard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Shop Domain
                </label>
                <input
                  type="text"
                  value={onboardData.shopDomain}
                  onChange={(e) =>
                    setOnboardData({ ...onboardData, shopDomain: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="your-shop.myshopify.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Access Token
                </label>
                <input
                  type="text"
                  value={onboardData.accessToken}
                  onChange={(e) =>
                    setOnboardData({ ...onboardData, accessToken: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="shpat_..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Shop Name (optional)
                </label>
                <input
                  type="text"
                  value={onboardData.shopName}
                  onChange={(e) =>
                    setOnboardData({ ...onboardData, shopName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="My Store"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

