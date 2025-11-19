const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, default: "customer" },
  // Customer specific fields
  phone: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  // Password reset fields
  resetCode: { type: String },
  resetCodeExpiry: { type: Date },
  resetToken: { type: String }
}, {
  timestamps: true,
  collection: 'customers' // Explicitly set collection name
});

// Hash password ONLY when modified and not already hashed
customerSchema.pre("save", async function (next) {
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
customerSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    if (!enteredPassword || !this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.error('Customer password comparison error:', error);
    return false;
  }
};

// Generate password reset code
customerSchema.methods.generateResetCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.resetCode = code;
  this.resetCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return code;
};

// Check if reset code is valid
customerSchema.methods.isResetCodeValid = function(code) {
  return this.resetCode === code && this.resetCodeExpiry > new Date();
};

// Clear reset fields
customerSchema.methods.clearResetFields = function() {
  this.resetCode = undefined;
  this.resetCodeExpiry = undefined;
  this.resetToken = undefined;
};

module.exports = mongoose.model("Customer", customerSchema);
