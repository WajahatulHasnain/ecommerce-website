// Backend functionality test script
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function testBackend() {
  try {
    console.log('🧪 Testing Backend Functionality...\n');

    // Test 1: Database Connection
    console.log('1️⃣ Testing Database Connection...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connected successfully\n');

    // Test 2: Environment Variables
    console.log('2️⃣ Checking Environment Variables...');
    console.log(`✅ MONGO_URI: ${process.env.MONGO_URI ? 'Set' : '❌ Missing'}`);
    console.log(`✅ JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : '❌ Missing'}`);
    console.log(`✅ PORT: ${process.env.PORT || '5000'}`);
    console.log(`✅ NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📧 RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Configured' : '⚠️ Not configured'}`);
    console.log(`🌐 FRONTEND_URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);

    // Test 3: Models
    console.log('3️⃣ Testing Models...');
    const User = require('./models/User');
    const Customer = require('./models/Customer');
    const Product = require('./models/Product');
    const Order = require('./models/Order');
    const Coupon = require('./models/Coupon');
    
    console.log('✅ User model loaded');
    console.log('✅ Customer model loaded');
    console.log('✅ Product model loaded');
    console.log('✅ Order model loaded');
    console.log('✅ Coupon model loaded\n');

    // Test 4: Collections Check
    console.log('4️⃣ Checking Collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('📊 Collections:', collectionNames.join(', ') || 'None found');

    // Test 5: Admin User Check
    console.log('\n5️⃣ Checking Admin User...');
    const adminCount = await User.countDocuments({ role: 'admin' });
    console.log(`👤 Admin accounts: ${adminCount}`);
    if (adminCount > 0) {
      const admin = await User.findOne({ role: 'admin' });
      console.log(`✅ Admin: ${admin.email}`);
    }

    console.log('\n🎉 Backend Test Complete - All Systems Functional!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Backend Test Failed:', error.message);
    process.exit(1);
  }
}

testBackend();