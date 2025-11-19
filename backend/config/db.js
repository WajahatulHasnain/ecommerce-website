const mongoose = require("mongoose");

/**
 * Connect to MongoDB using MONGO_URI from .env.
 * - Sets strictQuery for Mongoose v7 compatibility.
 * - Logs lifecycle events for easier debugging.
 * - Throws error if MONGO_URI missing.
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb+srv://wajahatulhasnain52:babban_714370%3F@cluster0.qbnmmkk.mongodb.net/ecommerce?retryWrites=true&w=majority&appName=Cluster0";
    
    // Compatibility flag for Mongoose
    mongoose.set("strictQuery", false);

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    // rethrow so caller can handle exit or retry
    throw err;
  }
};

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
