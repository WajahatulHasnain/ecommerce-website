import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import api from '../../utils/api';

const CustomerDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalOrders: 0,
      pendingOrders: 0,
      cartItems: 0,
      wishlistItems: 0
    },
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Fetch data using the API utility with proper headers
        const [ordersRes, cartRes, wishlistRes] = await Promise.all([
          api.get('/customer/orders'),
          api.get('/customer/cart'),
          api.get('/customer/wishlist')
        ]);

        // Extract data from API responses
        const orders = ordersRes.data?.data || ordersRes.data || [];
        const cart = cartRes.data?.data || cartRes.data || {};
        const wishlist = wishlistRes.data?.data || wishlistRes.data || {};

        setDashboardData({
          stats: {
            totalOrders: Array.isArray(orders) ? orders.length : 0,
            pendingOrders: Array.isArray(orders) ? orders.filter(order => order.status === 'pending' || order.status === 'processing').length : 0,
            cartItems: cart?.items?.length || cart?.length || 0,
            wishlistItems: wishlist?.items?.length || wishlist?.length || 0
          },
          recentOrders: Array.isArray(orders) ? orders.slice(0, 5) : []
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set default empty data on error
        setDashboardData({
          stats: {
            totalOrders: 0,
            pendingOrders: 0,
            cartItems: 0,
            wishlistItems: 0
          },
          recentOrders: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-etsy-orange"></div>
      </div>
    );
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="min-h-screen bg-warm-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section with Admin-style Background */}
        <div className="page-header mb-8">
          <div className="bg-gradient-to-r from-etsy-orange to-etsy-orange-dark text-white rounded-2xl p-6 shadow-large">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user.name || 'Customer'}! 👋
            </h1>
            <p className="text-white text-lg opacity-90">Here's what's happening with your account</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white border border-warm-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-warm-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-warm-gray-900">{dashboardData.stats.totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-etsy-orange/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-warm-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-warm-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-warm-gray-900">{dashboardData.stats.pendingOrders}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-warm-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-warm-gray-600">Cart Items</p>
                <p className="text-2xl font-bold text-warm-gray-900">{dashboardData.stats.cartItems}</p>
              </div>
              <div className="w-12 h-12 bg-sage/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🛒</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-warm-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-warm-gray-600">Wishlist</p>
                <p className="text-2xl font-bold text-warm-gray-900">{dashboardData.stats.wishlistItems}</p>
              </div>
              <div className="w-12 h-12 bg-dusty-rose/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">❤️</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions and Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <Card className="p-6 bg-white border border-warm-gray-200">
            <h3 className="text-xl font-semibold text-warm-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/customer/products"
                className="flex items-center p-3 rounded-lg border border-warm-gray-200 hover:border-etsy-orange hover:bg-etsy-orange/5 transition-colors"
              >
                <span className="text-2xl mr-3">🛍️</span>
                <div>
                  <p className="font-medium text-warm-gray-900">Browse Products</p>
                  <p className="text-sm text-warm-gray-600">Discover new items</p>
                </div>
              </Link>
              
              <Link
                to="/customer/cart"
                className="flex items-center p-3 rounded-lg border border-warm-gray-200 hover:border-sage hover:bg-sage/5 transition-colors"
              >
                <span className="text-2xl mr-3">🛒</span>
                <div>
                  <p className="font-medium text-warm-gray-900">Shopping Cart</p>
                  <p className="text-sm text-warm-gray-600">{dashboardData.stats.cartItems} items</p>
                </div>
              </Link>
              
              <Link
                to="/customer/orders"
                className="flex items-center p-3 rounded-lg border border-warm-gray-200 hover:border-warm-blue hover:bg-warm-blue/5 transition-colors"
              >
                <span className="text-2xl mr-3">📋</span>
                <div>
                  <p className="font-medium text-warm-gray-900">Order History</p>
                  <p className="text-sm text-warm-gray-600">{dashboardData.stats.totalOrders} orders</p>
                </div>
              </Link>
              
              <Link
                to="/customer/wishlist"
                className="flex items-center p-3 rounded-lg border border-warm-gray-200 hover:border-dusty-rose hover:bg-dusty-rose/5 transition-colors"
              >
                <span className="text-2xl mr-3">❤️</span>
                <div>
                  <p className="font-medium text-warm-gray-900">My Wishlist</p>
                  <p className="text-sm text-warm-gray-600">{dashboardData.stats.wishlistItems} items</p>
                </div>
              </Link>
            </div>
          </Card>

          {/* Recent Orders */}
          <Card className="lg:col-span-2 p-6 bg-white border border-warm-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-warm-gray-900">Recent Orders</h3>
              <Link
                to="/customer/orders"
                className="text-etsy-orange hover:text-etsy-orange-dark font-medium text-sm"
              >
                View all →
              </Link>
            </div>
            
            <div className="space-y-3">
              {dashboardData.recentOrders.length > 0 ? (
                dashboardData.recentOrders.map((order, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-warm-gray-100 hover:border-warm-gray-200 transition-colors">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-etsy-orange/10 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-lg">📋</span>
                      </div>
                      <div>
                        <p className="font-medium text-warm-gray-900">
                          Order #{order.orderNumber || order._id.slice(-4)}
                        </p>
                        <p className="text-sm text-warm-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-warm-gray-900">${order.totalPrice?.toFixed(2)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
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
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📦</div>
                  <p className="text-warm-gray-500">No orders yet</p>
                  <Link 
                    to="/customer/products" 
                    className="text-etsy-orange hover:underline text-sm"
                  >
                    Start shopping →
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;