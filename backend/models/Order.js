const mongoose = require("mongoose");
const Counter = require("./Counter");

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: false // Will be auto-generated in pre-save hook
  },
  orderNumber: {
    type: Number,
    unique: true,
    required: false // Remove required validation since pre-save hook will set it
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    title: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    imageUrl: String
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  coupon: {
    code: String,
    type: {
      type: String,
      enum: ["percentage", "fixed"]
    },
    discount: Number,
    appliedDiscount: Number
  },
  status: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
    default: "pending"
  },
  customerInfo: {
    name: String,
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  paymentMethod: {
    type: String,
    enum: ["cod", "credit_card", "debit_card", "paypal", "cash_on_delivery"],
    default: "cod"
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending"
  }
}, {
  timestamps: true
});

// Pre-save hook to auto-generate order number and order ID
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    try {
      this.orderNumber = await Counter.getNextSequence('order');
      this.orderId = `order${this.orderNumber}`;
      console.log(`📋 Generated order ID: ${this.orderId} (number: ${this.orderNumber}) for order ${this._id}`);
    } catch (error) {
      console.error('❌ Error generating order number:', error);
      return next(error);
    }
  }
  next();
});

// Virtual for display order ID (Order1, Order2, etc.)
orderSchema.virtual('displayOrderId').get(function() {
  return this.orderId || `order${this.orderNumber}`;
});

// Ensure virtual fields are serialized
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("Order", orderSchema);
