const Order = require("../../models/Order");
const Product = require("../../models/Product");
const User = require("../../models/User");

exports.summary = async (req, res) => {
  try {
    const { period } = req.query; // NEW: Support period parameter
    
    // Total sales and orders (using correct field name totalPrice)
    const totalAgg = await Order.aggregate([
      { $match: { status: { $in: ["shipped", "completed"] } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" }, count: { $sum: 1 } } }
    ]);

    // Get total pending orders
    const pendingOrders = await Order.countDocuments({ status: "pending" });

    // Top selling products from orders
    const topProducts = await Order.aggregate([
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

    // NEW: Flexible sales data based on period and data availability
    let salesData = [];
    let dateFilter = {};
    let dateFormat = "%Y-%m-%d"; // Default daily
    
    // Calculate date ranges
    const now = new Date();
    if (period === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: weekAgo } };
      dateFormat = "%Y-%m-%d"; // Daily for weekly view
    } else if (period === 'monthly') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: monthAgo } };
      dateFormat = "%Y-%m-%d"; // Daily for monthly view
    }
    // For 'total' or no period, show all data

    // Get order count to determine granularity
    const totalOrders = await Order.countDocuments({ 
      status: { $in: ["shipped", "completed"] },
      ...dateFilter
    });

    // Determine appropriate granularity based on data volume and range
    if (totalOrders > 90 && period === 'total') {
      // If lots of data and total view, group by month
      dateFormat = "%Y-%m";
    } else if (totalOrders > 30 && period === 'monthly') {
      // If lots of data in monthly view, group by week
      dateFormat = "%Y-W%U";
    }

    salesData = await Order.aggregate([
      { $match: { 
        status: { $in: ["shipped", "completed"] },
        ...dateFilter
      }},
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

    // Calculate trends for different periods
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
        salesData, // NEW: Flexible sales data instead of monthly
        trends, // NEW: Trend calculations
        period: period || 'total', // NEW: Current period
        granularity: dateFormat.includes('d') ? 'daily' : dateFormat.includes('W') ? 'weekly' : 'monthly'
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

// NEW: Calculate trends for different periods
async function calculateTrends() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalData, weeklyData, monthlyData] = await Promise.all([
    // Total (all time)
    Order.aggregate([
      { $match: { status: { $in: ["shipped", "completed"] } } },
      { $group: { _id: null, revenue: { $sum: "$totalPrice" }, orders: { $sum: 1 } } }
    ]),
    // Weekly
    Order.aggregate([
      { $match: { status: { $in: ["shipped", "completed"] }, createdAt: { $gte: weekAgo } } },
      { $group: { _id: null, revenue: { $sum: "$totalPrice" }, orders: { $sum: 1 } } }
    ]),
    // Monthly
    Order.aggregate([
      { $match: { status: { $in: ["shipped", "completed"] }, createdAt: { $gte: monthAgo } } },
      { $group: { _id: null, revenue: { $sum: "$totalPrice" }, orders: { $sum: 1 } } }
    ])
  ]);

  return {
    total: { revenue: totalData[0]?.revenue || 0, orders: totalData[0]?.orders || 0 },
    weekly: { revenue: weeklyData[0]?.revenue || 0, orders: weeklyData[0]?.orders || 0 },
    monthly: { revenue: monthlyData[0]?.revenue || 0, orders: monthlyData[0]?.orders || 0 }
  };
}
