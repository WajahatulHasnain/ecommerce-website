const Order = require("../../models/Order");
const Product = require("../../models/Product");
const User = require("../../models/User");

exports.summary = async (req, res) => {
  try {
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

    // Monthly sales data
    const monthly = await Order.aggregate([
      { $match: { status: { $in: ["shipped", "completed"] } } },
      { 
        $group: { 
          _id: { 
            year: { $year: "$createdAt" }, 
            month: { $month: "$createdAt" } 
          }, 
          revenue: { $sum: "$totalPrice" },
          orderCount: { $sum: 1 }
        } 
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

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
        monthly
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, msg: err.message });
  }
};
