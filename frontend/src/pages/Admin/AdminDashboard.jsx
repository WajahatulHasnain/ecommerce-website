import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Card from '../../components/ui/Card';

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await api.get('/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-etsy-orange"></div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Customers',
      value: dashboardData?.totalCustomers || 0,
      icon: '👥',
      color: 'bg-warm-blue'
    },
    {
      title: 'Total Products',
      value: dashboardData?.totalProducts || 0,
      icon: '📦',
      color: 'bg-sage-green'
    },
    {
      title: 'Total Orders',
      value: dashboardData?.totalOrders || 0,
      icon: '🛍️',
      color: 'bg-lavender'
    },
    {
      title: 'Revenue',
      value: `$${dashboardData?.revenue?.toLocaleString() || '0'}`,
      icon: '💰',
      color: 'bg-etsy-orange'
    }
  ];

  return (
    <div className="admin-layout">
      <div className="page-content">
        {/* Welcome Section */}
        <div className="page-header">
          <div className="bg-gradient-to-r from-etsy-orange to-etsy-orange-dark text-white rounded-2xl p-8 shadow-large">
            <h1 className="text-4xl font-bold mb-3">Welcome to Admin Dashboard</h1>
            <p className="text-etsy-orange-light text-lg">Manage your ecommerce platform efficiently</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-warm-gray-600 text-sm font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-warm-gray-800 mt-2">{stat.value}</p>
              </div>
              <div className={`w-14 h-14 rounded-xl ${stat.color} flex items-center justify-center text-2xl shadow-soft`}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="dashboard-card">
            <h3 className="text-xl font-bold text-warm-gray-900 mb-6">📋 Recent Orders</h3>
            <div className="space-y-4">
              {[1, 2, 3].map((_, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-warm-gray-50 rounded-xl border border-warm-gray-100">
                  <div>
                    <p className="font-semibold text-warm-gray-800">Order #00{index + 1}</p>
                    <p className="text-sm text-warm-gray-600">Customer {index + 1}</p>
                  </div>
                  <span className="text-sage-green font-bold text-lg">${(Math.random() * 200 + 50).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="dashboard-card">
            <h3 className="text-xl font-bold text-warm-gray-900 mb-6">⚡ Quick Actions</h3>
            <div className="space-y-4">
              <button className="w-full text-left p-4 bg-etsy-orange/10 border border-etsy-orange/20 rounded-xl hover:bg-etsy-orange/20 transition-all duration-200 hover:shadow-soft">
                <span className="font-semibold text-etsy-orange">📦 Add New Product</span>
              </button>
              <button className="w-full text-left p-4 bg-sage-green/10 border border-sage-green/20 rounded-xl hover:bg-sage-green/20 transition-all duration-200 hover:shadow-soft">
                <span className="font-semibold text-sage-green">🎫 Create Coupon</span>
              </button>
              <button className="w-full text-left p-4 bg-warm-blue/10 border border-warm-blue/20 rounded-xl hover:bg-warm-blue/20 transition-all duration-200 hover:shadow-soft">
                <span className="font-semibold text-warm-blue">📊 View Analytics</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
