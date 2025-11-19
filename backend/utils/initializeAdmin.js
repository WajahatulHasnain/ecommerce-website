const User = require("../models/User");
const bcrypt = require("bcryptjs");

const initializeAdmin = async () => {
  try {
    const adminEmail = "wajahatsardar714@gmail.com";
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log("✅ Admin account already exists");
      return;
    }
    
    // Create the admin user
    const adminUser = new User({
      name: "Wajahat Admin",
      email: adminEmail,
      password: "babban_714370?", // Will be hashed by pre-save middleware
      role: "admin"
    });
    
    await adminUser.save();
    console.log("✅ Admin account created successfully");
    console.log(`📧 Admin Email: ${adminEmail}`);
    console.log("🔐 Admin Password: babban_714370?");
    
  } catch (error) {
    console.error("❌ Failed to initialize admin:", error);
  }
};

module.exports = initializeAdmin;
