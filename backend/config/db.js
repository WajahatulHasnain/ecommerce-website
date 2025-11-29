const mongoose = require("mongoose");

/**
 * Connect to MongoDB using MONGO_URI from .env.
 * - Sets strictQuery for Mongoose v7 compatibility.
 * - Logs lifecycle events for easier debugging.
 * - Throws error if MONGO_URI missing.
 */
const connectDB = async () => {
  try {
    // Use MONGO_URI from .env file (your Atlas connection)
    const uri = process.env.MONGO_URI;
    
    if (!uri) {
      throw new Error("MONGO_URI environment variable is required");
    }
    
    // Compatibility flag for Mongoose
    mongoose.set("strictQuery", false);

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB Atlas connected successfully");
    console.log(`📍 Database: ${mongoose.connection.name}`);
    console.log(`🔗 Host: ${mongoose.connection.host}`);
    
    // Ensure indexes are created
    await createIndexes();
    
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    // rethrow so caller can handle exit or retry
    throw err;
  }
};

// Function to create necessary database indexes
async function createIndexes() {
  try {
    // Import models to ensure collections exist
    const Order = require('../models/Order');
    const User = require('../models/User');
    const Product = require('../models/Product');
    
    // Create indexes for better performance
    await Order.collection.createIndex({ userId: 1 });
    await Order.collection.createIndex({ status: 1 });
    await Order.collection.createIndex({ createdAt: -1 });
    await Order.collection.createIndex({ orderNumber: 1 }, { unique: true });
    
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await Product.collection.createIndex({ isActive: 1 });
    
    console.log("✅ Database indexes created successfully");
  } catch (error) {
    console.log("ℹ️ Indexes already exist or creation skipped:", error.message);
  }
}

// Attach helper to the function to get connection state easily from server
connectDB.getConnectionState = () => mongoose.connection.readyState;

// Listen to mongoose connection events for better debug logs
mongoose.connection.on("connected", () => {
  console.log("Mongoose event: connected");
});
mongoose.connection.on("disconnected", () => {
  console.warn("Mongoose event: disconnected");
});
mongoose.connection.on("error", (err) => {
  console.error("Mongoose event: error:", err.message);
});

module.exports = connectDB;
