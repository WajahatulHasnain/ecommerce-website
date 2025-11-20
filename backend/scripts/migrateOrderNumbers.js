/**
 * Migration script to assign sequential order numbers to existing orders
 * Run this script once after updating the Order schema
 */

const mongoose = require("mongoose");
const path = require("path");
const Order = require("../models/Order");
const Counter = require("../models/Counter");

// Load environment variables from the correct path
const dotenv = require('dotenv');
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Migration function
const migrateOrderNumbers = async () => {
  try {
    console.log('🔄 Starting order number migration...');

    // Get all orders without orderNumber, sorted by creation date
    const ordersWithoutNumbers = await Order.find({ 
      orderNumber: { $exists: false } 
    }).sort({ createdAt: 1 });

    console.log(`📊 Found ${ordersWithoutNumbers.length} orders without order numbers`);

    if (ordersWithoutNumbers.length === 0) {
      console.log('✅ No orders need migration. All orders already have order numbers.');
      return;
    }

    // Get current counter value or start from 1
    const counter = await Counter.findById('order');
    let currentOrderNumber = counter ? counter.sequence : 0;

    console.log(`🔢 Starting from order number: ${currentOrderNumber + 1}`);

    // Update orders one by one to maintain order
    for (const order of ordersWithoutNumbers) {
      currentOrderNumber++;
      
      // Update the order with the new number
      await Order.findByIdAndUpdate(
        order._id, 
        { orderNumber: currentOrderNumber },
        { runValidators: false } // Skip validation to avoid pre-save hook
      );

      console.log(`✏️ Assigned Order${currentOrderNumber} to order ${order._id}`);
    }

    // Update the counter to reflect the current state
    await Counter.findByIdAndUpdate(
      'order',
      { sequence: currentOrderNumber },
      { upsert: true }
    );

    console.log(`✅ Migration completed! Updated ${ordersWithoutNumbers.length} orders`);
    console.log(`🎯 Next new order will be Order${currentOrderNumber + 1}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration
const runMigration = async () => {
  try {
    await connectDB();
    await migrateOrderNumbers();
    console.log('🎉 Order number migration completed successfully!');
  } catch (error) {
    console.error('💥 Migration script failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from database');
    process.exit(0);
  }
};

// Execute if run directly
if (require.main === module) {
  runMigration();
}

module.exports = { migrateOrderNumbers };