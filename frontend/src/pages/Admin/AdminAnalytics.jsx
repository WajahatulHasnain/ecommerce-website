import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Card from '../../components/ui/Card';

export default function AdminAnalytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendPeriod, setTrendPeriod] = useState('total'); // NEW: Trend selector

  useEffect(() => {
    fetchAnalytics(trendPeriod);
  }, [trendPeriod]);

  const fetchAnalytics = async (period = 'total') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await api.get(`/admin/analytics/summary?period=${period}`, {
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

  const trendOptions = [
    { value: 'total', label: 'All Time', icon: '🌍' },
    { value: 'monthly', label: 'Last 30 Days', icon: '📅' },
    { value: 'weekly', label: 'Last 7 Days', icon: '📊' }
  ];

  const ChartPlaceholder = ({ title, data, emptyMessage }) => {
    if (!data || data.length === 0) {
      return (
        <div className="h-64 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
          <p className="text-gray-500 mb-2">📊 {title}</p>
          <p className="text-sm text-gray-400">{emptyMessage}</p>
        </div>
      );
    }

    // Simple bar chart visualization
    const maxValue = Math.max(...data.map(item => item.revenue || 0));
    
    return (
      <div className="h-64 bg-gray-50 rounded-lg p-4">
        <div className="flex items-end h-full space-x-2">
          {data.slice(-10).map((item, index) => { // Show last 10 data points
            const height = maxValue > 0 ? (item.revenue / maxValue) * 200 : 10;
            const date = new Date(item.date + (item.date.length === 7 ? '-01' : '')).toLocaleDateString();
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="bg-blue-600 rounded-t min-h-[10px] w-full transition-all duration-500"
                  style={{ height: `${height}px` }}
                  title={`${date}: $${item.revenue.toFixed(2)} (${item.orderCount} orders)`}
                ></div>
                <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                  {item.date.length === 7 ? item.date : item.date.slice(-5)}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-center">
          <p className="text-sm text-gray-600">
            {data.length} data point{data.length !== 1 ? 's' : ''} • 
            Max: ${maxValue.toFixed(2)}
          </p>
        </div>
      </div>
    );
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
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
      {/* Header with Trend Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">Track your business performance and insights</p>
        </div>
        
        {/* NEW: Trend Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {trendOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setTrendPeriod(option.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                trendPeriod === option.value
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {option.icon} {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Period Summary */}
      <Card className="p-4 bg-orange-50 border border-orange-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-orange-600">
              📈 <span className="font-semibold">
                {trendPeriod === 'total' ? 'All Time' : 
                 trendPeriod === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'} Performance
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Data granularity: {analyticsData.granularity || 'daily'}
            </div>
          </div>
          <div className="text-sm text-orange-600">
            {analyticsData.salesData?.length || 0} data points available
          </div>
        </div>
      </Card>

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

      {/* Charts Section - Enhanced */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
            Sales Revenue Trend
            <span className="text-sm text-gray-500 font-normal">
              {analyticsData.trends?.[trendPeriod]?.revenue ? 
                `$${analyticsData.trends[trendPeriod].revenue.toFixed(2)}` : '$0'
              }
            </span>
          </h3>
          <ChartPlaceholder 
            title="Sales Revenue"
            data={analyticsData.salesData}
            emptyMessage="No sales data available yet. Start selling to see trends!"
          />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
            Orders Trend
            <span className="text-sm text-gray-500 font-normal">
              {analyticsData.trends?.[trendPeriod]?.orders || 0} orders
            </span>
          </h3>
          <ChartPlaceholder 
            title="Order Count"
            data={analyticsData.salesData?.map(item => ({...item, revenue: item.orderCount}))}
            emptyMessage="No order data available yet. First orders will appear here!"
          />
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
