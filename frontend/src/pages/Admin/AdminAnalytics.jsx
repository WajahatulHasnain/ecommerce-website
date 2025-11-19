import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Card from '../../components/ui/Card';

export default function AdminAnalytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await api.get('/admin/analytics/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setAnalyticsData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, subtitle, trend }) => (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {trend && (
          <div className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-gray-600">Track your business performance and insights</p>
      </div>

      {/* Sales Overview */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Sales Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Sales"
            value={`$${analyticsData.totalSales.toFixed(2)}`}
          />
          <MetricCard
            title="Total Orders"
            value={analyticsData.ordersCount.toLocaleString()}
          />
          <MetricCard
            title="Average Order Value"
            value={`$${analyticsData.averageOrderValue.toFixed(2)}`}
          />
          <MetricCard
            title="Pending Orders"
            value={analyticsData.pendingOrders.toLocaleString()}
          />
        </div>
      </div>

      {/* Business Metrics */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Total Customers"
            value={analyticsData.totalCustomers.toLocaleString()}
          />
          <MetricCard
            title="Active Products"
            value={analyticsData.totalProducts.toLocaleString()}
          />
          <MetricCard
            title="New Customers"
            value={analyticsData.newCustomersThisMonth.toLocaleString()}
            subtitle="This month"
          />
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Sales</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
            <p className="text-gray-500 mb-2">📊 Monthly Sales Chart</p>
            {analyticsData.monthly.length > 0 ? (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {analyticsData.monthly.length} months of data available
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No sales data yet</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Orders Trend</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 mb-2">📈 Orders Trend</p>
              <p className="text-sm text-gray-600">
                Total: {analyticsData.ordersCount} orders
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
        {analyticsData.topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Product Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Units Sold</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Revenue</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Performance</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.topProducts.map((product, index) => {
                  const maxQty = Math.max(...analyticsData.topProducts.map(p => p.totalQty));
                  const percentage = maxQty > 0 ? (product.totalQty / maxQty) * 100 : 0;
                  
                  return (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-900">
                        {product.name || 'Unknown Product'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{product.totalQty}</td>
                      <td className="py-3 px-4 text-gray-600">
                        ${product.totalRevenue.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{width: `${percentage}%`}}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No sales data available</p>
            <p className="text-gray-400 text-sm mt-1">Products will appear here once orders are placed</p>
          </div>
        )}
      </Card>
    </div>
  );
}
