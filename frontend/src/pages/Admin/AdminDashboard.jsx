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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">Welcome to Admin Dashboard</h1>
        <p className="text-orange-100">Manage your ecommerce platform efficiently</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((_, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Order #00{index + 1}</p>
                  <p className="text-sm text-gray-600">Customer {index + 1}</p>
                </div>
                <span className="text-green-600 font-semibold">${(Math.random() * 200 + 50).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
              <span className="font-medium">📦 Add New Product</span>
            </button>
            <button className="w-full text-left p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
              <span className="font-medium">🎫 Create Coupon</span>
            </button>
            <button className="w-full text-left p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
              <span className="font-medium">📊 View Analytics</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
