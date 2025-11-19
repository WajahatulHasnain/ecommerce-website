const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin" },
  // Password reset fields
  resetCode: { type: String },
  resetCodeExpiry: { type: Date },
  resetToken: { type: String }
}, {
  timestamps: true,
  collection: 'admins' // Explicitly set collection name
});

// Hash password ONLY when modified and not already hashed
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
adminSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    if (!enteredPassword || !this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.error('Admin password comparison error:', error);
    return false;
  }
};

// Generate password reset code
adminSchema.methods.generateResetCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.resetCode = code;
  this.resetCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return code;
};

// Check if reset code is valid
adminSchema.methods.isResetCodeValid = function(code) {
  return this.resetCode === code && this.resetCodeExpiry > new Date();
};

// Clear reset fields
adminSchema.methods.clearResetFields = function() {
  this.resetCode = undefined;
  this.resetCodeExpiry = undefined;
  this.resetToken = undefined;
};

module.exports = mongoose.model("Admin", adminSchema);
