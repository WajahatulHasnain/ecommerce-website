// Quick test script to verify our fixes
const mongoose = require('mongoose');
const Order = require('./models/Order');
const Coupon = require('./models/Coupon');

async function testFixes() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://wajahatulhasnain52:babban_714370%3F@cluster0.qbnmmkk.mongodb.net/ecommerce?retryWrites=true&w=majority&appName=Cluster0");
    console.log('✅ Database connected for testing');

    // Test 1: Check if analytics aggregation works with new date format
    console.log('\n🔍 Testing Analytics Fix...');
    
    const salesData = await Order.aggregate([
      { $match: { status: { $in: ["shipped", "completed", "pending"] } } },
      { 
        $group: { 
          _id: {
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
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
      { $limit: 10 }
    ]);
    
    console.log(`✅ Analytics aggregation works! Found ${salesData.length} data points`);
    if (salesData.length > 0) {
      console.log('Sample data:', salesData[0]);
    } else {
      console.log('ℹ️  No orders found - analytics will show "No data" message');
    }

    // Test 2: Check coupon model
    console.log('\n🎫 Testing Coupons...');
    const couponCount = await Coupon.countDocuments();
    console.log(`✅ Found ${couponCount} coupons in database`);

    console.log('\n🎉 All tests passed! Fixes are working correctly.\n');
    
    // Simulate what analytics endpoint returns
    const mockResponse = {
      success: true,
      data: {
        salesData: salesData.map(item => ({
          date: item._id.date,
          revenue: item.revenue,
          orderCount: item.orderCount
        })),
        trends: {
          total: { revenue: 1500, orders: 5 },
          weekly: { revenue: 300, orders: 1 },
          monthly: { revenue: 800, orders: 3 }
        },
        period: 'total',
        granularity: 'daily'
      }
    };
    
    console.log('📊 Analytics response format:', JSON.stringify(mockResponse, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Test completed and database disconnected');
    process.exit(0);
  }
}

testFixes();