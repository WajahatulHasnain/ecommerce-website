const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Product title is required"],
    trim: true
  },
  description: {
    type: String,
    required: [true, "Product description is required"]
  },
  price: {
    type: Number,
    required: [true, "Product price is required"],
    min: [0, "Price cannot be negative"]
  },
  // Enhanced discount system - completely optional
  discount: {
    type: {
      type: String,
      enum: ['percentage', 'fixed']
    },
    value: {
      type: Number,
      min: 0
    },
    maxDiscount: {
      type: Number,
      min: 0
    },
    startDate: Date,
    endDate: Date
  },
  category: {
    type: String,
    required: [true, "Product category is required"],
    enum: ["electronics", "clothing", "home", "sports", "books", "beauty", "other"]
  },
  imageUrl: {
    type: String,
    default: ""
  },
  stock: {
    type: Number,
    required: [true, "Stock quantity is required"],
    min: [0, "Stock cannot be negative"],
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Legacy fields for backward compatibility
  onSale: {
    type: Boolean,
    default: false
  },
  salePrice: {
    type: Number,
    min: 0
  },
  discountPercent: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Virtual for getting the final price after discount
productSchema.virtual('finalPrice').get(function() {
  if (!this.discount || !this.discount.type || !this.discount.value) {
    return this.price;
  }
  
  // Check if discount is currently active
  const now = new Date();
  if (this.discount.startDate && now < this.discount.startDate) {
    return this.price;
  }
  if (this.discount.endDate && now > this.discount.endDate) {
    return this.price;
  }
  
  if (this.discount.type === 'percentage') {
    const discountAmount = (this.price * this.discount.value) / 100;
    const maxDiscount = this.discount.maxDiscount || discountAmount;
    const actualDiscount = Math.min(discountAmount, maxDiscount);
    return Math.max(0, this.price - actualDiscount);
  } else {
    // Fixed amount discount
    return Math.max(0, this.price - this.discount.value);
  }
});

// Virtual for getting the discount amount
productSchema.virtual('discountAmount').get(function() {
  return this.price - this.finalPrice;
});

// Virtual for getting the discount percentage (for display)
productSchema.virtual('discountPercentage').get(function() {
  if (this.price === 0) return 0;
  return Math.round((this.discountAmount / this.price) * 100);
});

// Method to check if discount is currently active
productSchema.methods.isDiscountActive = function() {
  if (!this.discount || !this.discount.type || !this.discount.value) return false;
  
  const now = new Date();
  if (this.discount.startDate && now < this.discount.startDate) return false;
  if (this.discount.endDate && now > this.discount.endDate) return false;
  
  return true;
};

// Index for better performance
productSchema.index({ category: 1 });
productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ createdBy: 1 });

module.exports = mongoose.model("Product", productSchema);
