const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
// Try backend/.env first, then project root .env, then default dotenv (process.env)
const backendEnv = path.join(__dirname, ".env");
const rootEnv = path.join(__dirname, "..", ".env");
if (fs.existsSync(backendEnv)) {
  dotenv.config({ path: backendEnv });
  console.log(`Loaded environment from ${backendEnv}`);
} else if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
  console.log(`Loaded environment from ${rootEnv}`);
} else {
  dotenv.config(); // fallback
  console.log("No .env file found in backend/ or project root; using process.env");
}
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const initializeAdmin = require("./utils/initializeAdmin");
const app = express();
// Allow configuring frontend URL (defaults to Vite dev host)
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5176";
const PORT = process.env.PORT || 5000;
// Restrict CORS to the frontend host + allow credentials for cookies if needed
app.use(
  cors({
    origin: [FRONTEND_URL, "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "http://localhost:5178"],
    credentials: true,
  })
);
app.use(express.json());
// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Authentication routes
app.use("/api/auth", require("./routes/auth"));
console.log("✅ Auth routes loaded");

// Admin routes (protected)
app.use("/api/admin", require("./routes/adminRoutes"));
console.log("✅ Admin routes loaded");

// Public routes for guest access (no auth required)
app.use("/api/public", require("./routes/publicRoutes"));
console.log("✅ Public routes loaded");

// Customer routes (protected)
app.use("/api/customer", require("./routes/customerRoutes"));
console.log("✅ Customer routes loaded");
// Health check
app.get("/api/health", (req, res) => {
  const state = mongoose.connection.readyState;
  res.json({
    status: "ok",
    db: { connected: state === 1 },
    timestamp: new Date(),
    admin: "wajahatsardar714@gmail.com"
  });
});
app.get("/", (req, res) => {
  if (process.env.NODE_ENV !== "production") {
    return res.redirect(FRONTEND_URL);
  }
  res.send("Ecommerce API Server - Ready");
});
// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
    user: req.user ? req.user._id : 'anonymous'
  });
  next();
});
// Global error handlers
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});
// Start server
(async () => {
  try {
    await connectDB();
    console.log("✅ Database connected successfully");
    // Initialize admin account
    await initializeAdmin();
    console.log("📊 Collections: users, products, orders");
    console.log("👤 Admin: wajahatsardar714@gmail.com");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🖼️ Images served at: ${FRONTEND_URL}/uploads/`);
    console.log(`📧 Email service: ${process.env.RESEND_API_KEY ? '✅ Configured' : '⚠️ Not configured'}`);
    console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
  });
  const gracefulShutdown = async () => {
    console.log("Shutting down gracefully...");
    try {
      await mongoose.disconnect();
    } catch (e) {
      console.error("Error disconnecting:", e.message);
    }
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  };

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
})();
