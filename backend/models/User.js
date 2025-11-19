const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"]
  },
  email: { 
    type: String, 
    required: [true, "Email is required"],
    unique: true, 
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
  },
  password: { 
    type: String, 
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"]
  },
  role: { 
    type: String, 
    enum: ["admin", "customer"], 
    default: "customer",
    required: true
  },
  // OTP fields for password reset
  resetCode: { type: String },
  resetCodeExpiry: { type: Date },
  resetToken: { type: String },
  // Additional fields
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, {
  timestamps: true,
  collection: 'users'
});

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Prevent creation of multiple admins
userSchema.pre("save", async function (next) {
  // Only allow one admin account
  if (this.role === "admin" && this.email !== "wajahatsardar714@gmail.com") {
    const error = new Error("Only one admin account is allowed");
    return next(error);
  }
  
  // Hash password if modified
  if (!this.isModified("password")) return next();
  
  // Check if password is already hashed
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

// Prevent role updates via findOneAndUpdate
userSchema.pre("findOneAndUpdate", function(next) {
  const update = this.getUpdate();
  
  // Block role changes
  if (update.role || (update.$set && update.$set.role)) {
    const error = new Error("Role cannot be modified");
    return next(error);
  }
  
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    if (!enteredPassword || !this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Generate OTP
userSchema.methods.generateResetCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.resetCode = code;
  this.resetCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return code;
};

// Validate OTP
userSchema.methods.isResetCodeValid = function(code) {
  return this.resetCode === code && 
         this.resetCodeExpiry && 
         this.resetCodeExpiry > new Date();
};

// Clear reset fields
userSchema.methods.clearResetFields = function() {
  this.resetCode = undefined;
  this.resetCodeExpiry = undefined;
  this.resetToken = undefined;
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
