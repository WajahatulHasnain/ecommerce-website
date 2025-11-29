const Order = require("../../models/Order");
const Product = require("../../models/Product");
const User = require("../../models/User");

exports.summary = async (req, res) => {
  try {
    const { period } = req.query;
    
    // Get first order date to establish day 1
    const firstOrder = await Order.findOne({ status: { $ne: "cancelled" } })
      .sort({ createdAt: 1 })
      .select('createdAt');
    
    const dayOne = firstOrder ? firstOrder.createdAt : new Date();
    
    // Total sales and orders (include all non-cancelled orders from day 1)
    const totalAgg = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" }, count: { $sum: 1 } } }
    ]);

    // Get total pending orders
    const pendingOrders = await Order.countDocuments({ status: "pending" });

    // Top selling products from orders (all time)
    const topProducts = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $unwind: "$products" },
      { 
        $group: { 
          _id: "$products.productId", 
          totalQty: { $sum: "$products.quantity" },
          totalRevenue: { $sum: { $multiply: ["$products.quantity", "$products.price"] } }
        } 
      },
      { $sort: { totalQty: -1 } },
      { $limit: 5 },
      { 
        $lookup: { 
          from: "products", 
          localField: "_id", 
          foreignField: "_id", 
          as: "product" 
        } 
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      { 
        $project: { 
          _id: 1, 
          totalQty: 1, 
          totalRevenue: 1,
          name: "$product.title",
          price: "$product.price"
        } 
      }
    ]);

    // Setup date filtering based on period with comprehensive data
    let salesData = [];
    let dateFilter = { status: { $ne: "cancelled" } };
    let dateFormat = "%Y-%m-%d";
    let startDate = dayOne; // Always start from day 1
    
    // Ensure endDate includes the complete current day
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of today
    
    // Determine date range and granularity based on period
    if (period === 'weekly') {
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0); // Start of day
      dateFormat = "%Y-%m-%d"; // Daily granularity for week
    } else if (period === 'monthly') {
      startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0); // Start of day
      dateFormat = "%Y-%m-%d"; // Daily granularity for month
    } else {
      // For 'total' period, show all data from day 1
      const daysSinceStart = Math.ceil((endDate - dayOne) / (1000 * 60 * 60 * 24));
      if (daysSinceStart > 365) {
        dateFormat = "%Y-%m"; // Monthly for > 1 year
      } else if (daysSinceStart > 60) {
        dateFormat = "%Y-W%U"; // Weekly for > 2 months
      } else {
        dateFormat = "%Y-%m-%d"; // Daily for <= 2 months
      }
      // Ensure startDate is beginning of day 1
      startDate = new Date(dayOne);
      startDate.setHours(0, 0, 0, 0);
    }

    // Apply comprehensive date filter including today
    dateFilter.createdAt = { $gte: startDate, $lte: endDate };

    // Get comprehensive sales data from specified start date
    salesData = await Order.aggregate([
      { $match: dateFilter },
      { 
        $group: { 
          _id: {
            date: {
              $dateToString: {
                format: dateFormat,
                date: "$createdAt",
                timezone: "UTC"
              }
            }
          }, 
          revenue: { $sum: "$totalPrice" },
          orderCount: { $sum: 1 },
          // Add real-time tracking fields
          lastOrderTime: { $max: "$createdAt" },
          firstOrderTime: { $min: "$createdAt" }
        } 
      },
      { $sort: { "_id.date": 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          revenue: 1,
          orderCount: 1,
          lastOrderTime: 1,
          firstOrderTime: 1
        }
      }
    ]);

    // Fill gaps in data to ensure continuous timeline including today
    if (salesData.length > 0) {
      salesData = fillDataGaps(salesData, startDate, endDate, dateFormat);
    } else {
      // Create empty data structure if no sales, ensuring today is included
      salesData = createEmptyDataStructure(startDate, endDate, dateFormat);
    }

    // Get today's specific data for real-time verification
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
    const todayData = await Order.aggregate([
      { 
        $match: { 
          status: { $ne: "cancelled" },
          createdAt: { $gte: todayStart, $lte: todayEnd }
        } 
      },
      { 
        $group: { 
          _id: null, 
          revenue: { $sum: "$totalPrice" },
          orderCount: { $sum: 1 },
          lastOrder: { $max: "$createdAt" }
        } 
      }
    ]);

    const todayStats = {
      revenue: todayData[0]?.revenue || 0,
      orders: todayData[0]?.orderCount || 0,
      lastOrder: todayData[0]?.lastOrder || null
    };

    // Calculate comprehensive trends
    const trends = await calculateComprehensiveTrends();

    // Customer metrics
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const totalProducts = await Product.countDocuments({ isActive: true });
    
    // New customers this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newCustomersThisMonth = await User.countDocuments({
      role: "customer",
      createdAt: { $gte: startOfMonth }
    });

    // Calculate average order value
    const totalSales = totalAgg[0]?.total || 0;
    const ordersCount = totalAgg[0]?.count || 0;
    const averageOrderValue = ordersCount > 0 ? totalSales / ordersCount : 0;

    console.log('📊 Analytics Summary (Enhanced with Today\'s Data):', {
      period: period || 'total',
      dayOne: dayOne.toISOString().split('T')[0],
      today: today.toISOString().split('T')[0],
      todayRevenue: todayStats.revenue,
      todayOrders: todayStats.orders,
      lastOrderToday: todayStats.lastOrder?.toISOString() || 'None',
      dataPoints: salesData.length,
      totalOrders: ordersCount,
      totalSales,
      dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      granularity: dateFormat.includes('d') ? 'daily' : dateFormat.includes('W') ? 'weekly' : 'monthly'
    });

    res.json({
      success: true,
      data: {
        totalSales,
        ordersCount,
        pendingOrders,
        averageOrderValue,
        totalCustomers,
        totalProducts,
        newCustomersThisMonth,
        topProducts,
        salesData,
        trends,
        period: period || 'total',
        granularity: dateFormat.includes('d') ? 'daily' : dateFormat.includes('W') ? 'weekly' : 'monthly',
        dayOne: dayOne,
        dataRange: {
          start: startDate,
          end: endDate,
          totalDays: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
        },
        // Real-time today's data
        todayStats: {
          revenue: todayStats.revenue,
          orders: todayStats.orders,
          lastOrder: todayStats.lastOrder,
          isToday: true,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

// Calculate comprehensive trends for different periods with full historical data
async function calculateComprehensiveTrends() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const previousWeek = new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
  const previousMonth = new Date(monthAgo.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalData, weeklyData, monthlyData, previousWeekData, previousMonthData] = await Promise.all([
    // Total (all time)
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, revenue: { $sum: "$totalPrice" }, orders: { $sum: 1 } } }
    ]),
    // Current week
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" }, createdAt: { $gte: weekAgo } } },
      { $group: { _id: null, revenue: { $sum: "$totalPrice" }, orders: { $sum: 1 } } }
    ]),
    // Current month
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" }, createdAt: { $gte: monthAgo } } },
      { $group: { _id: null, revenue: { $sum: "$totalPrice" }, orders: { $sum: 1 } } }
    ]),
    // Previous week
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" }, createdAt: { $gte: previousWeek, $lt: weekAgo } } },
      { $group: { _id: null, revenue: { $sum: "$totalPrice" }, orders: { $sum: 1 } } }
    ]),
    // Previous month
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" }, createdAt: { $gte: previousMonth, $lt: monthAgo } } },
      { $group: { _id: null, revenue: { $sum: "$totalPrice" }, orders: { $sum: 1 } } }
    ])
  ]);

  const current = {
    total: { revenue: totalData[0]?.revenue || 0, orders: totalData[0]?.orders || 0 },
    weekly: { revenue: weeklyData[0]?.revenue || 0, orders: weeklyData[0]?.orders || 0 },
    monthly: { revenue: monthlyData[0]?.revenue || 0, orders: monthlyData[0]?.orders || 0 }
  };

  const previous = {
    weekly: { revenue: previousWeekData[0]?.revenue || 0, orders: previousWeekData[0]?.orders || 0 },
    monthly: { revenue: previousMonthData[0]?.revenue || 0, orders: previousMonthData[0]?.orders || 0 }
  };

  // Calculate percentage changes
  const trends = {
    total: current.total,
    weekly: {
      ...current.weekly,
      revenueChange: calculatePercentageChange(current.weekly.revenue, previous.weekly.revenue),
      ordersChange: calculatePercentageChange(current.weekly.orders, previous.weekly.orders)
    },
    monthly: {
      ...current.monthly,
      revenueChange: calculatePercentageChange(current.monthly.revenue, previous.monthly.revenue),
      ordersChange: calculatePercentageChange(current.monthly.orders, previous.monthly.orders)
    }
  };

  return trends;
}

// Helper function to calculate percentage change
function calculatePercentageChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// Helper function to fill gaps in data for continuous timeline (including today)
function fillDataGaps(salesData, startDate, endDate, dateFormat) {
  const filledData = [];
  const dataMap = new Map(salesData.map(item => [item.date, item]));
  
  let currentDate = new Date(startDate);
  const finalDate = new Date(endDate);
  
  while (currentDate <= finalDate) {
    let dateKey;
    
    if (dateFormat.includes('%d')) {
      // Daily format - ensure we capture today
      dateKey = currentDate.toISOString().split('T')[0];
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (dateFormat.includes('%U')) {
      // Weekly format
      const year = currentDate.getFullYear();
      const weekNum = getWeekNumber(currentDate);
      dateKey = `${year}-W${weekNum.toString().padStart(2, '0')}`;
      currentDate.setDate(currentDate.getDate() + 7);
    } else {
      // Monthly format
      const year = currentDate.getFullYear();
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      dateKey = `${year}-${month}`;
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    if (dataMap.has(dateKey)) {
      filledData.push({
        ...dataMap.get(dateKey),
        isToday: isToday(dateKey)
      });
    } else {
      filledData.push({
        date: dateKey,
        revenue: 0,
        orderCount: 0,
        isToday: isToday(dateKey),
        lastOrderTime: null,
        firstOrderTime: null
      });
    }
  }
  
  return filledData;
}

// Helper function to create empty data structure (including today)
function createEmptyDataStructure(startDate, endDate, dateFormat) {
  const emptyData = [];
  let currentDate = new Date(startDate);
  const finalDate = new Date(endDate);
  
  while (currentDate <= finalDate && emptyData.length < 1000) { // Prevent infinite loops
    let dateKey;
    
    if (dateFormat.includes('%d')) {
      dateKey = currentDate.toISOString().split('T')[0];
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (dateFormat.includes('%U')) {
      const year = currentDate.getFullYear();
      const weekNum = getWeekNumber(currentDate);
      dateKey = `${year}-W${weekNum.toString().padStart(2, '0')}`;
      currentDate.setDate(currentDate.getDate() + 7);
    } else {
      const year = currentDate.getFullYear();
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      dateKey = `${year}-${month}`;
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    emptyData.push({
      date: dateKey,
      revenue: 0,
      orderCount: 0,
      isToday: isToday(dateKey),
      lastOrderTime: null,
      firstOrderTime: null
    });
  }
  
  return emptyData;
}

// Helper function to check if date is today
function isToday(dateKey) {
  const today = new Date().toISOString().split('T')[0];
  return dateKey === today;
}

// Helper function to get week number
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
