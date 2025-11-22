import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Card from '../../components/ui/Card';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/customer/dashboard', {
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

  const quickStats = [
    {
      title: 'Total Orders',
      value: dashboardData?.totalOrders || 0,
      icon: '📋',
      gradient: 'from-warm-blue to-lavender',
      bgColor: 'bg-gradient-to-br from-blue-50 to-purple-50',
      textColor: 'text-warm-blue',
      link: '/customer/orders'
    },
    {
      title: 'Cart Items',
      value: dashboardData?.cartCount || 0,
      icon: '🛒',
      gradient: 'from-sage to-success',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
      textColor: 'text-sage',
      link: '/customer/cart'
    },
    {
      title: 'Wishlist Items',
      value: dashboardData?.wishlistCount || 0,
      icon: '❤️',
      gradient: 'from-dusty-rose to-error',
      bgColor: 'bg-gradient-to-br from-red-50 to-pink-50',
      textColor: 'text-dusty-rose',
      link: '/customer/wishlist'
    },
    {
      title: 'Total Spent',
      value: `$${dashboardData?.totalSpent?.toLocaleString() || '0.00'}`,
      icon: '💰',
      gradient: 'from-etsy-orange to-etsy-orange-dark',
      bgColor: 'bg-gradient-to-br from-orange-50 to-red-50',
      textColor: 'text-etsy-orange',
      link: '/customer/orders'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-etsy-orange via-warm-blue to-lavender text-white rounded-3xl p-8 lg:p-12 shadow-large">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-3">Welcome back, {user?.name}! 👋</h1>
              <p className="text-lg lg:text-xl opacity-90 mb-6 max-w-2xl">
                Ready to discover something amazing today? Your personalized shopping experience awaits.
              </p>
            </div>
            <div className="hidden lg:block text-8xl opacity-20">
              🛍️
            </div>
          </div>
          <Link
            to="/customer/products"
            className="inline-flex items-center px-8 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-2xl font-semibold transition-all duration-200 hover:scale-105"
          >
            Start Shopping 
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Link key={index} to={stat.link} className="group">
            <Card variant="elevated" className={`p-8 ${stat.bgColor} border-0 group-hover:shadow-large transition-all duration-300 transform group-hover:-translate-y-2`}>
              <div className="flex items-center justify-between mb-6">
                <div className={`w-16 h-16 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center text-3xl shadow-medium group-hover:scale-110 transition-transform duration-300`}>
                  {stat.icon}
                </div>
                <svg className="w-6 h-6 text-warm-gray-400 group-hover:text-etsy-orange transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
              <div>
                <p className="text-warm-gray-600 text-sm font-medium uppercase tracking-wider mb-2">{stat.title}</p>
                <p className={`text-3xl lg:text-4xl font-bold ${stat.textColor} mb-2`}>{stat.value}</p>
                <p className="text-warm-gray-500 text-sm group-hover:text-etsy-orange transition-colors">View details →</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <Card variant="dashboard" className="p-8">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-etsy-orange to-etsy-orange-dark rounded-xl flex items-center justify-center mr-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-2xl font-bold text-warm-gray-900">Quick Actions</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/customer/products"
              className="group p-6 bg-white rounded-2xl border-2 border-warm-gray-100 hover:border-etsy-orange hover:shadow-medium transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🛍️</div>
              <p className="font-bold text-warm-gray-800 group-hover:text-etsy-orange mb-1">Browse Products</p>
              <p className="text-sm text-warm-gray-500">Discover new items</p>
            </Link>
            
            <Link
              to="/customer/cart"
              className="group p-6 bg-white rounded-2xl border-2 border-warm-gray-100 hover:border-sage hover:shadow-medium transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🛒</div>
              <p className="font-bold text-warm-gray-800 group-hover:text-sage mb-1">Shopping Cart</p>
              <p className="text-sm text-warm-gray-500">{dashboardData?.cartCount || 0} items</p>
            </Link>
            
            <Link
              to="/customer/orders"
              className="group p-6 bg-white rounded-2xl border-2 border-warm-gray-100 hover:border-warm-blue hover:shadow-medium transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📋</div>
              <p className="font-bold text-warm-gray-800 group-hover:text-warm-blue mb-1">Order History</p>
              <p className="text-sm text-warm-gray-500">{dashboardData?.totalOrders || 0} orders</p>
            </Link>
            
            <Link
              to="/customer/wishlist"
              className="group p-6 bg-white rounded-2xl border-2 border-warm-gray-100 hover:border-dusty-rose hover:shadow-medium transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">❤️</div>
              <p className="font-bold text-warm-gray-800 group-hover:text-dusty-rose mb-1">My Wishlist</p>
              <p className="text-sm text-warm-gray-500">{dashboardData?.wishlistCount || 0} items</p>
            </Link>
          </div>
        </Card>

        {/* Recent Orders */}
        <Card variant="dashboard" className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-lavender to-warm-blue rounded-xl flex items-center justify-center mr-4">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-2xl font-bold text-warm-gray-900">Recent Orders</h3>
            </div>
            <Link
              to="/customer/orders"
              className="text-etsy-orange hover:text-etsy-orange-dark font-semibold flex items-center text-sm transition-colors"
            >
              View all 
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {dashboardData?.recentOrders?.length > 0 ? (
              dashboardData.recentOrders.map((order, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-warm-gray-100 hover:shadow-soft transition-all duration-200">
                  <div className="flex items-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-etsy-orange-light to-etsy-orange rounded-xl flex items-center justify-center mr-4 shadow-soft">
                      <span className="text-white text-lg font-bold">📋</span>
                    </div>
                    <div>
                      <p className="font-bold text-warm-gray-800">Order{order.orderNumber || order._id.slice(-4)}</p>
                      <p className="text-sm text-warm-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-warm-gray-800">${order.totalPrice?.toFixed(2)}</p>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-warm-gray-100 text-warm-gray-700'
                    }`}>
                      {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-6">📦</div>
                <p className="text-warm-gray-500 text-lg font-semibold mb-2">No orders yet</p>
                <p className="text-warm-gray-400 mb-8">Start shopping to see your orders here</p>
                <Link
                  to="/customer/products"
                  className="inline-flex items-center px-6 py-3 bg-etsy-orange text-white rounded-xl hover:bg-etsy-orange-dark transition-colors font-semibold"
                >
                  Browse Products
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Additional Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="soft" className="p-8 text-center border-2 border-sage/20">
          <div className="w-16 h-16 bg-gradient-to-br from-sage to-success rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🚚</span>
          </div>
          <h4 className="font-bold text-warm-gray-800 mb-3 text-lg">Free Shipping</h4>
          <p className="text-warm-gray-600">On orders over $50. Fast and reliable delivery to your doorstep.</p>
        </Card>
        
        <Card variant="soft" className="p-8 text-center border-2 border-warm-blue/20">
          <div className="w-16 h-16 bg-gradient-to-br from-warm-blue to-lavender rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🔒</span>
          </div>
          <h4 className="font-bold text-warm-gray-800 mb-3 text-lg">Secure Payment</h4>
          <p className="text-warm-gray-600">Your data is protected with industry-leading security measures.</p>
        </Card>
        
        <Card variant="soft" className="p-8 text-center border-2 border-etsy-orange/20">
          <div className="w-16 h-16 bg-gradient-to-br from-etsy-orange to-etsy-orange-dark rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🎁</span>
          </div>
          <h4 className="font-bold text-warm-gray-800 mb-3 text-lg">Special Offers</h4>
          <p className="text-warm-gray-600">Exclusive deals and personalized recommendations just for you.</p>
        </Card>
      </div>
    </div>
  );
}
