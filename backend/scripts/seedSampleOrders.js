const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const connectDB = require('../config/db');

// Load environment variables
require('dotenv').config();

const createSampleOrders = async () => {
  try {
    console.log('🔄 Creating sample orders for analytics testing...');
    
    // Connect to database
    await connectDB();
    
    // Find or create a customer user
    let customer = await User.findOne({ role: 'customer' });
    if (!customer) {
      customer = new User({
        name: 'John Customer',
        email: 'customer@test.com',
        password: 'hashedpassword123',
        role: 'customer',
        isVerified: true
      });
      await customer.save();
      console.log('✅ Created sample customer');
    }
    
    // Find or create sample products
    let products = await Product.find({ isActive: true }).limit(3);
    if (products.length === 0) {
      const sampleProducts = [
        {
          title: 'Sample Laptop',
          description: 'High-performance laptop',
          price: 999.99,
          category: 'electronics',
          stock: 50,
          isActive: true
        },
        {
          title: 'Wireless Headphones',
          description: 'Premium wireless headphones',
          price: 199.99,
          category: 'electronics',
          stock: 100,
          isActive: true
        },
        {
          title: 'Smart Watch',
          description: 'Latest smartwatch with health tracking',
          price: 299.99,
          category: 'electronics',
          stock: 75,
          isActive: true
        }
      ];
      
      products = await Product.create(sampleProducts);
      console.log('✅ Created sample products');
    }
    
    // Delete existing orders to avoid duplicates
    await Order.deleteMany({});
    console.log('🗑️ Cleared existing orders');
    
    // Create sample orders over the last 30 days
    const orders = [];
    const now = new Date();
    
    for (let i = 0; i < 20; i++) {
      // Random date within last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const orderDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      // Random selection of products
      const selectedProducts = products.slice(0, Math.floor(Math.random() * 3) + 1);
      const orderProducts = selectedProducts.map(product => ({
        productId: product._id,
        title: product.title,
        quantity: Math.floor(Math.random() * 3) + 1,
        price: product.price,
        imageUrl: product.imageUrl || ''
      }));
      
      // Calculate totals
      const subtotal = orderProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discount = Math.random() > 0.7 ? Math.floor(Math.random() * 50) : 0; // 30% chance of discount
      const totalPrice = subtotal - discount;
      
      // Random status distribution
      const statuses = ['pending', 'processing', 'shipped', 'delivered'];
      const statusWeights = [0.2, 0.3, 0.3, 0.2]; // More processing/shipped orders
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      const order = {
        userId: customer._id,
        products: orderProducts,
        subtotal,
        discount,
        totalPrice,
        status: randomStatus,
        customerInfo: {
          name: customer.name,
          email: customer.email,
          phone: '+1234567890',
          address: {
            street: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'United States'
          }
        },
        paymentMethod: 'credit_card',
        paymentStatus: 'completed',
        createdAt: orderDate,
        updatedAt: orderDate
      };
      
      orders.push(order);
    }
    
    // Insert all orders
    const createdOrders = await Order.create(orders);
    console.log(`✅ Created ${createdOrders.length} sample orders`);
    
    // Display summary
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    
    console.log('📊 Analytics Summary:');
    console.log('Orders by status:', ordersByStatus);
    console.log('Total revenue:', totalRevenue[0]?.total || 0);
    
    // Test the analytics endpoint data
    console.log('🧪 Testing analytics data...');
    const salesData = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
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
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          revenue: 1,
          orderCount: 1
        }
      }
    ]);
    
    console.log(`📈 Generated ${salesData.length} data points for charts`);
    salesData.forEach(point => {
      console.log(`  ${point.date}: $${point.revenue.toFixed(2)} (${point.orderCount} orders)`);
    });
    
  } catch (error) {
    console.error('❌ Error creating sample orders:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
  }
};

// Run the script
if (require.main === module) {
  createSampleOrders();
}

module.exports = createSampleOrders;