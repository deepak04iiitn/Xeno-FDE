import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
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
import { API_BASE_URL } from '../config/api';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [stats, setStats] = useState(null);
  const [ordersByDate, setOrdersByDate] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);
  const [revenueByDay, setRevenueByDay] = useState([]);
  const [customerAcquisition, setCustomerAcquisition] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [orderValueDistribution, setOrderValueDistribution] = useState([]);
  const [growthMetrics, setGrowthMetrics] = useState(null);
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
      const response = await fetch(`${API_BASE_URL}/api/tenants`, {
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
      const [
        statsRes, 
        ordersRes, 
        customersRes, 
        trendsRes,
        statusRes,
        dayRes,
        acquisitionRes,
        monthlyRes,
        distributionRes,
        growthRes
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/api/insights/${selectedTenant}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/insights/${selectedTenant}/orders-by-date`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/insights/${selectedTenant}/top-customers?limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/insights/${selectedTenant}/revenue-trends?period=30`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/insights/${selectedTenant}/order-status`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/insights/${selectedTenant}/revenue-by-day`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/insights/${selectedTenant}/customer-acquisition?period=30`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/insights/${selectedTenant}/monthly-revenue`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/insights/${selectedTenant}/order-value-distribution`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/insights/${selectedTenant}/growth-metrics`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [
        statsData, 
        ordersData, 
        customersData, 
        trendsData,
        statusData,
        dayData,
        acquisitionData,
        monthlyData,
        distributionData,
        growthData
      ] = await Promise.all([
        statsRes.json(),
        ordersRes.json(),
        customersRes.json(),
        trendsRes.json(),
        statusRes.json(),
        dayRes.json(),
        acquisitionRes.json(),
        monthlyRes.json(),
        distributionRes.json(),
        growthRes.json(),
      ]);

      setStats(statsData);
      setOrdersByDate(ordersData.ordersByDate || []);
      setTopCustomers(customersData.topCustomers || []);
      setRevenueTrends(trendsData.trends || []);
      setOrderStatus(statusData.statusDistribution || []);
      setRevenueByDay(dayData.revenueByDay || []);
      setCustomerAcquisition(acquisitionData.acquisition || []);
      setMonthlyRevenue(monthlyData.monthlyRevenue || []);
      setOrderValueDistribution(distributionData.distribution || []);
      setGrowthMetrics(growthData);

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
        `${API_BASE_URL}/api/ingestion/${selectedTenant}/sync`,
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
      const response = await fetch(`${API_BASE_URL}/api/tenants`, {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-sky-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
          <div className="text-slate-600 font-medium">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-sky-50/20">

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/80 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">

            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-sky-600 bg-clip-text text-transparent">
                Xeno Dashboard
              </h1>
              {user && <p className="text-sm text-slate-500 mt-0.5">{user.email}</p>}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowOnboardModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 font-medium"
              >
                <Plus className="h-4 w-4" />
                Connect Store
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200 font-medium"
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
          <div className="mb-8 flex flex-wrap items-center gap-4 bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/80 shadow-sm">

            <label className="text-sm font-semibold text-slate-700">Select Store:</label>

            <select
              value={selectedTenant || ''}
              onChange={(e) => setSelectedTenant(parseInt(e.target.value))}
              className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-medium text-slate-700 shadow-sm transition-all"
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
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 rounded-xl hover:from-slate-200 hover:to-slate-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm border border-slate-200"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            
          </div>
        )}

        {tenants.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-sky-100 mb-6">
              <ShoppingBag className="h-10 w-10 text-indigo-600" />
            </div>
            <p className="text-slate-600 mb-6 text-lg font-medium">No stores connected yet.</p>
            <button
              onClick={() => setShowOnboardModal(true)}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 font-semibold"
            >
              <Plus className="h-5 w-5" />
              Connect Your First Store
            </button>
          </div>
        ) : selectedTenant && stats ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Total Customers</h3>
                  <div className="p-2 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
                    <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">{stats.customers.total.toLocaleString()}</p>
              </div>

              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Total Orders</h3>
                  <div className="p-2 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                    <ShoppingBag className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">{stats.orders.total.toLocaleString()}</p>
              </div>

              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-lg hover:shadow-sky-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Total Revenue</h3>
                  <div className="p-2 rounded-xl bg-sky-50 group-hover:bg-sky-100 transition-colors">
                    <DollarSign className="h-5 w-5 text-sky-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">
                  ${stats.orders.revenue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                </p>
              </div>

              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Avg Order Value</h3>
                  <div className="p-2 rounded-xl bg-purple-50 group-hover:bg-purple-100 transition-colors">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">
                  ${stats.orders.avgOrderValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Revenue Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#6366f1" 
                      strokeWidth={3}
                      dot={{ fill: '#6366f1', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Revenue ($)" 
                    />
                    <Line
                      type="monotone"
                      dataKey="avgOrderValue"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Avg Order Value ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Orders by Date</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ordersByDate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar 
                      dataKey="orderCount" 
                      fill="#6366f1" 
                      radius={[8, 8, 0, 0]}
                      name="Orders" 
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="#10b981" 
                      radius={[8, 8, 0, 0]}
                      name="Revenue ($)" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Growth Metrics */}
            {growthMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-indigo-50 via-indigo-50/50 to-indigo-100/50 rounded-2xl p-6 border border-indigo-200/80 shadow-sm hover:shadow-md transition-all duration-300">
                  <h3 className="text-sm font-semibold text-indigo-700 mb-3 uppercase tracking-wide">Week over Week</h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold text-indigo-900">
                      {growthMetrics.weekOverWeek.growth >= 0 ? '+' : ''}
                      {growthMetrics.weekOverWeek.growth.toFixed(1)}%
                    </span>
                    <span className="text-sm font-medium text-indigo-600">revenue growth</span>
                  </div>
                  <p className="text-xs text-indigo-600/80 mt-2">
                    ${growthMetrics.weekOverWeek.current.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} vs ${growthMetrics.weekOverWeek.previous.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} last week
                  </p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 via-emerald-50/50 to-emerald-100/50 rounded-2xl p-6 border border-emerald-200/80 shadow-sm hover:shadow-md transition-all duration-300">
                  <h3 className="text-sm font-semibold text-emerald-700 mb-3 uppercase tracking-wide">Month over Month</h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold text-emerald-900">
                      {growthMetrics.monthOverMonth.growth >= 0 ? '+' : ''}
                      {growthMetrics.monthOverMonth.growth.toFixed(1)}%
                    </span>
                    <span className="text-sm font-medium text-emerald-600">revenue growth</span>
                  </div>
                  <p className="text-xs text-emerald-600/80 mt-2">
                    ${growthMetrics.monthOverMonth.current.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} vs ${growthMetrics.monthOverMonth.previous.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} last month
                  </p>
                </div>
              </div>
            )}

            {/* Additional Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Order Status Distribution */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Order Status Distribution</h3>
                {orderStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={orderStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {orderStatus.map((entry, index) => {
                          const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }} 
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-slate-400">
                    No order status data available
                  </div>
                )}
              </div>

              {/* Revenue by Day of Week */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Revenue by Day of Week</h3>
                {revenueByDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="day" stroke="#64748b" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }} 
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar 
                        dataKey="revenue" 
                        fill="#6366f1" 
                        radius={[8, 8, 0, 0]}
                        name="Revenue ($)" 
                      />
                      <Bar 
                        dataKey="orderCount" 
                        fill="#10b981" 
                        radius={[8, 8, 0, 0]}
                        name="Orders" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-slate-400">
                    No day-of-week data available
                  </div>
                )}
              </div>
            </div>

            {/* Additional Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Customer Acquisition */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Customer Acquisition (30 Days)</h3>
                {customerAcquisition.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={customerAcquisition}>
                      <defs>
                        <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }} 
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Area 
                        type="monotone" 
                        dataKey="newCustomers" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        fill="url(#colorCustomers)"
                        name="New Customers" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-slate-400">
                    No customer acquisition data available
                  </div>
                )}
              </div>

              {/* Monthly Revenue */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Monthly Revenue (Last 12 Months)</h3>
                {monthlyRevenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }} 
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar 
                        dataKey="revenue" 
                        fill="#10b981" 
                        radius={[8, 8, 0, 0]}
                        name="Revenue ($)" 
                      />
                      <Bar 
                        dataKey="orderCount" 
                        fill="#6366f1" 
                        radius={[8, 8, 0, 0]}
                        name="Orders" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-slate-400">
                    No monthly revenue data available
                  </div>
                )}
              </div>
            </div>

            {/* Order Value Distribution */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300 mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Order Value Distribution</h3>
              {orderValueDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={orderValueDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="range" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar 
                      dataKey="orderCount" 
                      fill="#8b5cf6" 
                      radius={[8, 8, 0, 0]}
                      name="Order Count" 
                    />
                    <Bar 
                      dataKey="totalRevenue" 
                      fill="#f59e0b" 
                      radius={[8, 8, 0, 0]}
                      name="Total Revenue ($)" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-slate-400">
                  No order value distribution data available
                </div>
              )}
            </div>

            {/* Top Customers */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">Top 5 Customers</h3>
                {topCustomers.length > 0 && !topCustomers[0]?.hasProtectedData && (
                  <span className="text-xs text-slate-500 italic bg-slate-50 px-3 py-1 rounded-lg">
                    Customer names/emails require Shopify Plus/Advanced plan
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-4 px-4 text-sm font-bold text-slate-700 uppercase tracking-wide">
                        Customer
                      </th>
                      <th className="text-right py-4 px-4 text-sm font-bold text-slate-700 uppercase tracking-wide">
                        Total Spent
                      </th>
                      <th className="text-right py-4 px-4 text-sm font-bold text-slate-700 uppercase tracking-wide">
                        Orders
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="h-8 w-8 text-slate-300" />
                            <span>No customer data available yet</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      topCustomers.map((customer, index) => (
                        <tr 
                          key={customer.id} 
                          className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors duration-150"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-sky-100 text-indigo-600 font-semibold text-sm">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {customer.name || customer.identifier || `Customer #${customer.shopifyCustomerId || customer.id}`}
                                </p>
                                {customer.email ? (
                                  <p className="text-sm text-slate-500">{customer.email}</p>
                                ) : customer.shopifyCustomerId ? (
                                  <p className="text-xs text-slate-400">
                                    Shopify ID: {customer.shopifyCustomerId}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-bold text-slate-900">
                              ${customer.totalSpent.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-sm">
                              {customer.ordersCount}
                            </span>
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
          <div className="text-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-slate-600 font-medium">Loading dashboard data...</p>
            </div>
          </div>
        )}
      </div>

      {/* Onboard Modal */}
      {showOnboardModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setShowOnboardModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl border border-slate-200/80 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-sky-100 mb-4">
                <Plus className="h-6 w-6 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Connect Shopify Store</h2>
              <p className="text-sm text-slate-600">Add a new store to your dashboard</p>
            </div>
            <form onSubmit={handleOnboard} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Shop Domain
                </label>
                <input
                  type="text"
                  value={onboardData.shopDomain}
                  onChange={(e) =>
                    setOnboardData({ ...onboardData, shopDomain: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                  placeholder="your-shop.myshopify.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Access Token
                </label>
                <input
                  type="text"
                  value={onboardData.accessToken}
                  onChange={(e) =>
                    setOnboardData({ ...onboardData, accessToken: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                  placeholder="shpat_..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Shop Name <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={onboardData.shopName}
                  onChange={(e) =>
                    setOnboardData({ ...onboardData, shopName: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                  placeholder="My Store"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/30"
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

