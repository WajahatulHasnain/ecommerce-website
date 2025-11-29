import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Card from '../../components/ui/Card';
import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';
import { useSettings } from '../../context/SettingsContext';

export default function AdminAnalytics() {
  const { formatPrice } = useSettings();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendPeriod, setTrendPeriod] = useState('total');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [newDataAlert, setNewDataAlert] = useState(false);

  useEffect(() => {
    fetchAnalytics(trendPeriod);
    
    // Set up real-time auto-refresh every 15 seconds for better performance
    let refreshInterval;
    if (autoRefresh) {
      refreshInterval = setInterval(() => {
        fetchAnalytics(trendPeriod, true); // Silent refresh for real-time updates
      }, 15000); // Reduced to 15 seconds for more responsive updates
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [trendPeriod, autoRefresh]);

  const fetchAnalytics = async (period = 'total', silent = false) => {
    try {
      if (!silent) setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const response = await api.get(`/admin/analytics/summary?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const newData = response.data.data;
        
        // Check for new data if we have previous data
        if (analyticsData && silent) {
          const hasNewOrders = newData.ordersCount > analyticsData.ordersCount;
          const hasNewRevenue = newData.totalSales > analyticsData.totalSales;
          
          if (hasNewOrders || hasNewRevenue) {
            setNewDataAlert(true);
            // Auto-hide alert after 5 seconds
            setTimeout(() => setNewDataAlert(false), 5000);
          }
        }
        
        setAnalyticsData(newData);
        setLastUpdated(new Date());
        
        console.log('📊 Real-time Analytics Update:', {
          period,
          orders: newData.ordersCount,
          revenue: newData.totalSales,
          dataPoints: newData.salesData?.length,
          silent
        });
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Show user-friendly error notification
      if (!silent) {
        alert('Failed to fetch analytics data. Please check your connection and try again.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const trendOptions = [
    { value: 'total', label: 'All Time', icon: '🌍' },
    { value: 'monthly', label: 'Last 30 Days', icon: '📅' },
    { value: 'weekly', label: 'Last 7 Days', icon: '📊' }
  ];

  const ChartContainer = ({ title, data, emptyMessage, chartType = 'line', dataKey = 'revenue' }) => {
    if (!data || data.length === 0) {
      return (
        <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex flex-col items-center justify-center border border-gray-200/50">
          <div className="text-4xl mb-4 opacity-50">📊</div>
          <p className="text-gray-600 mb-2 font-medium">{title}</p>
          <p className="text-sm text-gray-400 text-center px-4">{emptyMessage}</p>
        </div>
      );
    }

    const chartColor = dataKey === 'revenue' ? '#F16623' : '#9CAF88';

    return (
      <div className="space-y-4">
        {chartType === 'line' ? (
          <LineChart 
            data={data}
            dataKey={dataKey}
            color={chartColor}
            title={title}
            formatPrice={formatPrice}
          />
        ) : (
          <BarChart 
            data={data}
            dataKey={dataKey}
            color={chartColor}
            title={title}
            formatPrice={formatPrice}
          />
        )}
        
        {/* Chart Stats Summary */}
        <div className="flex justify-between items-center text-xs text-gray-500 px-2">
          <span>{data.length} data point{data.length !== 1 ? 's' : ''}</span>
          <span>
            {dataKey === 'revenue' ? 'Total' : 'Sum'}: {
              dataKey === 'revenue' 
                ? formatPrice(data.reduce((sum, item) => sum + (item.revenue || 0), 0))
                : data.reduce((sum, item) => sum + (item[dataKey] || 0), 0).toLocaleString()
            }
          </span>
          <span>
            Avg: {
              dataKey === 'revenue' 
                ? formatPrice(data.reduce((sum, item) => sum + (item.revenue || 0), 0) / data.length)
                : Math.round(data.reduce((sum, item) => sum + (item[dataKey] || 0), 0) / data.length).toLocaleString()
            }
          </span>
        </div>
      </div>
    );
  };

  const MetricCard = ({ title, value, subtitle, trend, icon, color = 'etsy-orange' }) => {
    const colorClasses = {
      'etsy-orange': 'from-etsy-orange/10 to-etsy-orange/5 border-etsy-orange/20',
      'sage-green': 'from-sage-green/10 to-sage-green/5 border-sage-green/20',
      'warm-gray': 'from-warm-gray-300/10 to-warm-gray-200/5 border-warm-gray-300/20',
      'blue': 'from-blue-500/10 to-blue-400/5 border-blue-500/20'
    };

    const iconColors = {
      'etsy-orange': 'text-etsy-orange',
      'sage-green': 'text-sage-green',
      'warm-gray': 'text-warm-gray-600',
      'blue': 'text-blue-500'
    };

    return (
      <Card className={`p-6 bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm border transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group`}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              {icon && <span className={`text-lg ${iconColors[color]} group-hover:scale-110 transition-transform`}>{icon}</span>}
              <p className="text-sm font-medium text-gray-600">{title}</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
              {value}
            </p>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          {trend && (
            <div className={`text-sm font-medium px-3 py-1 rounded-full ${
              trend > 0 
                ? 'text-emerald-700 bg-emerald-100/80' 
                : 'text-red-700 bg-red-100/80'
            } backdrop-blur-sm`}>
              <span className="text-base">{trend > 0 ? '↗' : '↘'}</span> {Math.abs(trend)}%
            </div>
          )}
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-warm-gray-50 to-sage-green/5">
        <div className="relative">
          {/* Spinning gradient loader */}
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent bg-gradient-to-r from-etsy-orange via-sage-green to-etsy-orange bg-clip-border"></div>
          <div className="absolute inset-2 bg-white rounded-full"></div>
          <div className="absolute inset-4 bg-gradient-to-r from-etsy-orange/20 to-sage-green/20 rounded-full animate-pulse"></div>
        </div>
        <div className="mt-6 text-center">
          <h3 className="text-xl font-semibold text-gray-700">Loading Analytics</h3>
          <p className="text-gray-500 mt-2">Gathering your business insights...</p>
          <div className="mt-4 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-etsy-orange rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-sage-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-etsy-orange rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-warm-gray-50 to-red-50/30">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">📊❌</div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Failed to Load Analytics</h3>
          <p className="text-gray-600 mb-6">We couldn't retrieve your analytics data. Please check your connection and try again.</p>
          <button 
            onClick={() => fetchAnalytics(trendPeriod)}
            className="px-6 py-3 bg-gradient-to-r from-etsy-orange to-etsy-orange/80 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            🔄 Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-gradient-to-br from-warm-gray-50 to-sage-green/5 min-h-screen p-6">
      {/* Real-time Data Alert */}
      {newDataAlert && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg shadow-xl border border-green-400 animate-bounce">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🔔</span>
            <span className="font-medium">New activity detected!</span>
            <button 
              onClick={() => setNewDataAlert(false)}
              className="ml-3 text-green-100 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header with Trend Selector */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-etsy-orange to-sage-green bg-clip-text text-transparent">
            Analytics & Reports
          </h1>
          <div className="flex items-center space-x-4">
            <p className="text-gray-600 text-lg">Track your business performance and insights</p>
            {lastUpdated && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Auto-refresh Toggle */}
          <div className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/20">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoRefresh ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoRefresh ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
            <span className="text-sm font-medium text-gray-700">Auto-refresh</span>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={() => fetchAnalytics(trendPeriod)}
            disabled={loading}
            className="px-4 py-2 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 text-gray-700 hover:bg-white/90 transition-all duration-200 disabled:opacity-50"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Enhanced Trend Selector */}
          <div className="flex bg-white/70 backdrop-blur-sm rounded-xl p-1.5 shadow-lg border border-white/20">
            {trendOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setTrendPeriod(option.value)}
                className={`px-5 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                  trendPeriod === option.value
                    ? 'bg-gradient-to-r from-etsy-orange to-etsy-orange/80 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <span className="mr-2">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Period Summary with Today's Data */}
      <Card className="p-6 bg-gradient-to-r from-etsy-orange/10 via-white/50 to-sage-green/10 border border-etsy-orange/20 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 text-etsy-orange">
              <div className="p-2 bg-etsy-orange/10 rounded-lg">
                <span className="text-xl">📈</span>
              </div>
              <div>
                <span className="font-semibold text-lg">
                  {trendPeriod === 'total' ? `All Time Performance` : 
                   trendPeriod === 'weekly' ? 'Last 7 Days Performance' : 'Last 30 Days Performance'}
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  Data from {analyticsData.dataRange ? new Date(analyticsData.dataRange.start).toLocaleDateString() : 'day 1'} 
                  {' to '} {analyticsData.dataRange ? new Date(analyticsData.dataRange.end).toLocaleDateString() : 'today'}
                  {' • '}<span className="font-medium">{analyticsData.granularity || 'daily'}</span> granularity
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {analyticsData.salesData?.length || 0}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Data Points</div>
            </div>
            <div className="w-px h-8 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-sage-green">
                {formatPrice((analyticsData.trends?.[trendPeriod]?.revenue || 0))}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Period Revenue</div>
            </div>
            <div className="w-px h-8 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-500">
                {analyticsData.dataRange?.totalDays || 0} days
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Data Coverage</div>
            </div>
          </div>
        </div>
        
        {/* Today's Real-time Stats */}
        {analyticsData.todayStats && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">Today's Activity</span>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-etsy-orange">
                    {formatPrice(analyticsData.todayStats.revenue)}
                  </div>
                  <div className="text-xs text-gray-500">Revenue Today</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-sage-green">
                    {analyticsData.todayStats.orders}
                  </div>
                  <div className="text-xs text-gray-500">Orders Today</div>
                </div>
                {analyticsData.todayStats.lastOrder && (
                  <div className="text-center">
                    <div className="text-sm font-medium text-blue-500">
                      {new Date(analyticsData.todayStats.lastOrder).toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-gray-500">Last Order</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Real-time Status Indicator */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-600">
                Real-time updates: <span className="font-medium">{autoRefresh ? 'ON' : 'OFF'}</span>
              </span>
              {lastUpdated && (
                <span className="text-sm text-gray-500">
                  • Last sync: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>🔄 Updates every 15s</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Enhanced Sales Overview */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
          <span className="mr-3 p-2 bg-etsy-orange/10 rounded-lg">💰</span>
          Sales Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Sales"
            value={formatPrice(analyticsData.totalSales)}
            icon="💰"
            color="etsy-orange"
          />
          <MetricCard
            title="Total Orders"
            value={analyticsData.ordersCount.toLocaleString()}
            icon="📦"
            color="sage-green"
          />
          <MetricCard
            title="Average Order Value"
            value={formatPrice(analyticsData.averageOrderValue)}
            icon="📊"
            color="blue"
          />
          <MetricCard
            title="Pending Orders"
            value={analyticsData.pendingOrders.toLocaleString()}
            subtitle="Awaiting processing"
            icon="⏳"
            color="warm-gray"
          />
        </div>
      </div>

      {/* Enhanced Business Metrics */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
          <span className="mr-3 p-2 bg-sage-green/10 rounded-lg">📈</span>
          Business Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Total Customers"
            value={analyticsData.totalCustomers.toLocaleString()}
            icon="👥"
            color="sage-green"
          />
          <MetricCard
            title="Active Products"
            value={analyticsData.totalProducts.toLocaleString()}
            icon="🛍️"
            color="etsy-orange"
          />
          <MetricCard
            title="New Customers"
            value={analyticsData.newCustomersThisMonth.toLocaleString()}
            subtitle="This month"
            icon="✨"
            color="blue"
          />
        </div>
      </div>

      {/* Enhanced Charts Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
          <span className="mr-3 p-2 bg-blue-500/10 rounded-lg">📊</span>
          Performance Charts
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6 bg-gradient-to-br from-white via-white to-etsy-orange/5 border border-etsy-orange/20 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="mr-2 p-2 bg-etsy-orange/10 rounded-lg">💰</span>
                Sales Revenue Trend
              </h3>
              <div className="text-right">
                <div className="text-2xl font-bold text-etsy-orange">
                  {formatPrice(analyticsData.trends?.[trendPeriod]?.revenue || 0)}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Period Total</div>
              </div>
            </div>
            <ChartContainer 
              title="Sales Revenue"
              data={analyticsData.salesData}
              emptyMessage="No sales data available yet. Start selling to see trends!"
              chartType="line"
              dataKey="revenue"
            />
          </Card>

          <Card className="p-6 bg-gradient-to-br from-white via-white to-sage-green/5 border border-sage-green/20 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="mr-2 p-2 bg-sage-green/10 rounded-lg">📦</span>
                Orders Trend
              </h3>
              <div className="text-right">
                <div className="text-2xl font-bold text-sage-green">
                  {analyticsData.trends?.[trendPeriod]?.orders || 0}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Period Orders</div>
              </div>
            </div>
            <ChartContainer 
              title="Order Count"
              data={analyticsData.salesData?.map(item => ({...item, orderCount: item.orderCount}))}
              emptyMessage="No order data available yet. First orders will appear here!"
              chartType="bar"
              dataKey="orderCount"
            />
          </Card>
        </div>
      </div>

      {/* Enhanced Top Products */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
          <span className="mr-3 p-2 bg-yellow-500/10 rounded-lg">🏆</span>
          Top Selling Products
        </h2>
        <Card className="p-6 bg-gradient-to-br from-white via-white to-yellow-500/5 border border-yellow-500/20 backdrop-blur-sm">
          {analyticsData.topProducts.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-4 px-4 font-semibold text-gray-900">Rank</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-900">Product Name</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-900">Units Sold</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-900">Revenue</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-900">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {analyticsData.topProducts.map((product, index) => {
                      const maxQty = Math.max(...analyticsData.topProducts.map(p => p.totalQty));
                      const percentage = maxQty > 0 ? (product.totalQty / maxQty) * 100 : 0;
                      
                      const rankIcons = ['🥇', '🥈', '🥉', '🏅', '🏅'];
                      const rankIcon = rankIcons[index] || '🏅';
                      
                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-etsy-orange/5 hover:to-transparent transition-all duration-300">
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-xl">{rankIcon}</span>
                              <span className="font-semibold text-gray-700">#{index + 1}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-medium text-gray-900">
                              {product.name || 'Unknown Product'}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-sage-green">{product.totalQty}</span>
                              <span className="text-sm text-gray-500">units</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-semibold text-etsy-orange">
                              {formatPrice(product.totalRevenue)}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-etsy-orange to-etsy-orange/80 h-3 rounded-full transition-all duration-1000 ease-out" 
                                  style={{width: `${percentage}%`}}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-600 min-w-[3rem]">
                                {percentage.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Summary Stats */}
              <div className="border-t pt-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-etsy-orange/5 to-transparent rounded-lg">
                    <div className="text-2xl font-bold text-etsy-orange">
                      {analyticsData.topProducts.reduce((sum, p) => sum + p.totalQty, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Units Sold</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-sage-green/5 to-transparent rounded-lg">
                    <div className="text-2xl font-bold text-sage-green">
                      {formatPrice(analyticsData.topProducts.reduce((sum, p) => sum + p.totalRevenue, 0))}
                    </div>
                    <div className="text-sm text-gray-600">Total Revenue</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-blue-500/5 to-transparent rounded-lg">
                    <div className="text-2xl font-bold text-blue-500">
                      {analyticsData.topProducts.length}
                    </div>
                    <div className="text-sm text-gray-600">Products Listed</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-50">🛍️</div>
              <p className="text-xl text-gray-600 mb-2 font-medium">No sales data available</p>
              <p className="text-gray-400 max-w-md mx-auto">
                Products will appear here once orders are placed. Start by adding products and promoting your store!
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
