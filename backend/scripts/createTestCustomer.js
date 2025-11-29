const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function createTestCustomer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if test customer already exists
    const existingCustomer = await User.findOne({ email: 'test@customer.com' });
    if (existingCustomer) {
      console.log('📧 Test customer already exists: test@customer.com');
      console.log('🔑 Password: password123');
      return;
    }

    const testCustomer = new User({
      name: 'Test Customer',
      email: 'test@customer.com',
      password: 'password123', // Will be hashed automatically by the User model
      role: 'customer',
      isVerified: true
    });

    await testCustomer.save();
    console.log('✅ Test customer created successfully!');
    console.log('📧 Email: test@customer.com');
    console.log('🔑 Password: password123');
    console.log('🎯 Role: customer');
  } catch (error) {
    console.error('❌ Error creating test customer:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createTestCustomer();