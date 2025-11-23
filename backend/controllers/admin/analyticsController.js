const Order = require("../../models/Order");
const Product = require("../../models/Product");
const User = require("../../models/User");

exports.summary = async (req, res) => {
  try {
    const { period } = req.query;
    
    // Total sales and orders (include all non-cancelled orders)
    const totalAgg = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" }, count: { $sum: 1 } } }
    ]);

    // Get total pending orders
    const pendingOrders = await Order.countDocuments({ status: "pending" });

    // Top selling products from orders
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

    // Sales data based on period
    let salesData = [];
    let dateFilter = { status: { $ne: "cancelled" } };
    let dateFormat = "%Y-%m-%d";
    
    const now = new Date();
    if (period === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter.createdAt = { $gte: weekAgo };
      dateFormat = "%Y-%m-%d";
    } else if (period === 'monthly') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter.createdAt = { $gte: monthAgo };
      dateFormat = "%Y-%m-%d";
    }

    // Get order count to determine granularity
    const totalOrders = await Order.countDocuments(dateFilter);

    // Determine appropriate granularity
    if (totalOrders > 90 && period === 'total') {
      dateFormat = "%Y-%m";
    } else if (totalOrders > 30 && period === 'monthly') {
      dateFormat = "%Y-W%U";
    }

    // Always ensure we have at least some data points for charts
    if (totalOrders > 0) {
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
            orderCount: { $sum: 1 }
          } 
        },
        { $sort: { "_id.date": 1 } },
        {
          $project: {
            _id: 0,
            date: "$_id.date",
            revenue: 1,
            orderCount: 1
          }
        }
      ]);
    } else {
      // If no orders exist, create sample data points to show chart structure
      const today = new Date();
      salesData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        salesData.push({
          date: date.toISOString().split('T')[0],
          revenue: 0,
          orderCount: 0
        });
      }
    }

    // Calculate trends
    const trends = await calculateTrends();

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

    console.log('📊 Analytics Summary:', {
      totalOrders: ordersCount,
      totalSales,
      salesDataPoints: salesData.length,
      period: period || 'total'
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
        granularity: dateFormat.includes('d') ? 'daily' : dateFormat.includes('W') ? 'weekly' : 'monthly'
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

// Calculate trends for different periods
async function calculateTrends() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalData, weeklyData, monthlyData] = await Promise.all([
    // Total (all time)
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, revenue: { $sum: "$totalPrice" }, orders: { $sum: 1 } } }
    ]),
    // Weekly
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" }, createdAt: { $gte: weekAgo } } },
      { $group: { _id: null, revenue: { $sum: "$totalPrice" }, orders: { $sum: 1 } } }
    ]),
    // Monthly
    Order.aggregate([
      { $match: { status: { $ne: "cancelled" }, createdAt: { $gte: monthAgo } } },
      { $group: { _id: null, revenue: { $sum: "$totalPrice" }, orders: { $sum: 1 } } }
    ])
  ]);

  return {
    total: { revenue: totalData[0]?.revenue || 0, orders: totalData[0]?.orders || 0 },
    weekly: { revenue: weeklyData[0]?.revenue || 0, orders: weeklyData[0]?.orders || 0 },
    monthly: { revenue: monthlyData[0]?.revenue || 0, orders: monthlyData[0]?.orders || 0 }
  };
}
