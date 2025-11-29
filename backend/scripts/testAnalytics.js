const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// Test script to create sample data for analytics testing
async function createTestData() {
  try {
    // Connect to MongoDB Atlas using environment variables
    require('dotenv').config();
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas');
    console.log('📍 Database:', mongoose.connection.name);
    console.log('🔗 Connection String:', mongoUri.replace(/:[^:]*@/, ':***@'));

    // Clean up any existing test data to avoid conflicts
    console.log('🧹 Cleaning existing test data...');
    await Order.deleteMany({ 'customerInfo.email': 'testcustomer@example.com' });
    await Product.deleteMany({ title: 'Test Analytics Product' });
    await User.deleteMany({ email: 'testcustomer@example.com' });
    
    // Reset counter if it exists
    const Counter = require('../models/Counter');
    await Counter.deleteMany({ _id: 'order' });
    console.log('✅ Cleaned up existing data');

    // Create test user if not exists
    let testUser = await User.findOne({ email: 'testcustomer@example.com' });
    if (!testUser) {
      testUser = new User({
        name: 'Test Customer',
        email: 'testcustomer@example.com',
        password: 'hashedpassword123',
        role: 'customer'
      });
      await testUser.save();
      console.log('✅ Created test user');
    }

    // Create test product if not exists
    let testProduct = await Product.findOne({ title: 'Test Analytics Product' });
    if (!testProduct) {
      testProduct = new Product({
        title: 'Test Analytics Product',
        description: 'A product for testing analytics',
        price: 25.99,
        category: 'electronics', // Valid enum value
        stock: 100,
        isActive: true,
        createdBy: testUser._id, // Required field
        images: ['test-image.jpg']
      });
      await testProduct.save();
      console.log('✅ Created test product');
    }

    // Create historical orders across different dates
    const orders = [];
    const currentTime = new Date();
    
    // Create orders across the last 30 days
    for (let i = 29; i >= 0; i--) {
      const orderDate = new Date(currentTime.getTime() - i * 24 * 60 * 60 * 1000);
      
      // Random number of orders per day (0-5)
      const ordersPerDay = Math.floor(Math.random() * 6);
      
      for (let j = 0; j < ordersPerDay; j++) {
        const randomHour = Math.floor(Math.random() * 24);
        const randomMinute = Math.floor(Math.random() * 60);
        const specificDate = new Date(orderDate);
        specificDate.setHours(randomHour, randomMinute, 0, 0);
        
        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 items
        const order = {
          userId: testUser._id,
          products: [{
            productId: testProduct._id,
            title: testProduct.title,
            quantity: quantity,
            price: testProduct.price,
            imageUrl: testProduct.imageUrl
          }],
          subtotal: quantity * testProduct.price,
          totalPrice: quantity * testProduct.price,
          status: 'delivered',
          createdAt: specificDate,
          updatedAt: specificDate,
          customerInfo: {
            name: testUser.name,
            email: testUser.email,
            phone: '123-456-7890',
            address: {
              street: '123 Test St',
              city: 'Test City',
              state: 'Test State',
              zipCode: '12345',
              country: 'Test Country'
            }
          }
        };
        
        orders.push(order);
      }
    }

    // Insert orders individually to avoid bulk insert conflicts
    let createdCount = 0;
    for (const orderData of orders) {
      try {
        const order = new Order(orderData);
        await order.save();
        createdCount++;
      } catch (error) {
        console.log(`⚠️ Skipped order due to error: ${error.message}`);
      }
    }
    
    if (createdCount > 0) {
      console.log(`✅ Created ${createdCount} historical test orders`);
    }

    // Create a few recent orders to simulate real-time activity (including today)
    const recentOrders = [];
    const now = new Date();
    
    // Create orders for today at different times
    for (let i = 0; i < 5; i++) {
      const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      todayDate.setHours(9 + i * 2, Math.floor(Math.random() * 60), 0, 0); // Orders throughout the day
      const quantity = Math.floor(Math.random() * 2) + 1;
      
      recentOrders.push({
        userId: testUser._id,
        products: [{
          productId: testProduct._id,
          quantity: quantity,
          price: testProduct.price
        }],
        totalPrice: quantity * testProduct.price,
        status: Math.random() > 0.5 ? 'pending' : 'delivered',
        createdAt: todayDate,
        updatedAt: todayDate,
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        }
      });
    }
    
    // Add some very recent orders (last hour)
    for (let i = 0; i < 3; i++) {
      const recentDate = new Date(now.getTime() - (i * 10 * 60 * 1000)); // Last 30 minutes
      const quantity = Math.floor(Math.random() * 2) + 1;
      
      recentOrders.push({
        userId: testUser._id,
        products: [{
          productId: testProduct._id,
          title: testProduct.title,
          quantity: quantity,
          price: testProduct.price,
          imageUrl: testProduct.imageUrl
        }],
        subtotal: quantity * testProduct.price,
        totalPrice: quantity * testProduct.price,
        status: 'pending',
        createdAt: recentDate,
        updatedAt: recentDate,
        customerInfo: {
          name: testUser.name,
          email: testUser.email,
          phone: '123-456-7890',
          address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            country: 'Test Country'
          }
        }
      });
    }

    if (recentOrders.length > 0) {
      for (const orderData of recentOrders) {
        const order = new Order(orderData);
        await order.save();
      }
      console.log(`✅ Created ${recentOrders.length} orders for today and recent real-time testing`);
    }

    // Get today's specific stats
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const todayStats = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: todayStart, $lte: todayEnd },
          status: { $ne: 'cancelled' }
        } 
      },
      { 
        $group: { 
          _id: null, 
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
          lastOrder: { $max: '$createdAt' }
        } 
      }
    ]);

    // Print summary
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    console.log('\\n📊 Analytics Test Data Summary:');
    console.log(`Total Orders: ${totalOrders}`);
    console.log(`Total Revenue: $${(totalRevenue[0]?.total || 0).toFixed(2)}`);
    console.log(`Today's Orders: ${todayStats[0]?.orders || 0}`);
    console.log(`Today's Revenue: $${(todayStats[0]?.revenue || 0).toFixed(2)}`);
    if (todayStats[0]?.lastOrder) {
      console.log(`Last Order Today: ${todayStats[0].lastOrder.toLocaleString()}`);
    }
    console.log(`Test Product ID: ${testProduct._id}`);
    console.log(`Test User ID: ${testUser._id}`);
    console.log('\\n🚀 Analytics dashboard now has comprehensive data including TODAY real-time stats!');
    console.log('\\n🔔 Check the dashboard - today data should be visible with real-time updates!');
    
  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\\nDisconnected from MongoDB');
  }
}

// Function to add a single real-time order (for testing)
async function addRealtimeOrder() {
  try {
    require('dotenv').config();
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas for real-time order');
    
    const testUser = await User.findOne({ email: 'testcustomer@example.com' });
    const testProduct = await Product.findOne({ title: 'Test Analytics Product' });
    
    if (!testUser || !testProduct) {
      console.log('❌ Test user or product not found. Run createTestData first.');
      return;
    }

    const quantity = Math.floor(Math.random() * 3) + 1;
    const now = new Date(); // This will be TODAY
    
    const newOrder = new Order({
      userId: testUser._id,
      products: [{
        productId: testProduct._id,
        title: testProduct.title,
        quantity: quantity,
        price: testProduct.price,
        imageUrl: testProduct.imageUrl || ''
      }],
      subtotal: quantity * testProduct.price,
      totalPrice: quantity * testProduct.price,
      status: 'pending',
      createdAt: now, // Explicitly set to now (today)
      updatedAt: now,
      customerInfo: {
        name: testUser.name,
        email: testUser.email,
        phone: '123-456-7890',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'Test Country'
        }
      }
    });

    await newOrder.save();
    console.log(`🔔 New real-time order created for TODAY!`);
    console.log(`   Order ID: ${newOrder.orderId || newOrder._id}`);
    console.log(`   Order Number: ${newOrder.orderNumber}`);
    console.log(`   Revenue: $${newOrder.totalPrice.toFixed(2)}`);
    console.log(`   Time: ${now.toLocaleString()}`);
    console.log(`   Date: ${now.toISOString().split('T')[0]} (Today)`);
    console.log('\\n📊 This order should appear in analytics within 15 seconds!');
    
  } catch (error) {
    console.error('Error creating real-time order:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Check command line arguments
const command = process.argv[2];

if (command === 'create') {
  createTestData();
} else if (command === 'realtime') {
  addRealtimeOrder();
} else {
  console.log('Usage:');
  console.log('node testAnalytics.js create    - Create comprehensive test data');
  console.log('node testAnalytics.js realtime - Add a single real-time order');
}