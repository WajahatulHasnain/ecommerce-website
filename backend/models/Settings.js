const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  storeName: {
    type: String,
    required: true,
    default: "My Ecommerce Store"
  },
  storeDescription: {
    type: String,
    default: "Welcome to our online store"
  },
  currency: {
    code: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'PKR'],
      default: 'USD'
    },
    symbol: {
      type: String,
      default: '$'
    },
    rate: {
      type: Number,
      default: 1.0 // Base rate (USD = 1.0)
    }
  },
  taxRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 10 // 10% tax
  },
  shippingFee: {
    type: Number,
    min: 0,
    default: 5.99
  },
  freeShippingThreshold: {
    type: Number,
    min: 0,
    default: 50 // Free shipping over $50
  },
  // Currency exchange rates relative to USD
  exchangeRates: {
    USD: { type: Number, default: 1.0 },
    EUR: { type: Number, default: 0.85 },
    GBP: { type: Number, default: 0.73 },
    JPY: { type: Number, default: 110.0 },
    CAD: { type: Number, default: 1.25 },
    AUD: { type: Number, default: 1.35 },
    CHF: { type: Number, default: 0.92 },
    CNY: { type: Number, default: 6.45 },
    INR: { type: Number, default: 74.5 },
    PKR: { type: Number, default: 278.0 }
  }
}, {
  timestamps: true
});

// Static method to get or create settings
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Method to convert price from USD to selected currency
settingsSchema.methods.convertPrice = function(usdPrice) {
  const rate = this.exchangeRates[this.currency.code] || 1.0;
  return (usdPrice * rate).toFixed(2);
};

// Method to convert price from selected currency to USD  
settingsSchema.methods.convertToUSD = function(localPrice) {
  const rate = this.exchangeRates[this.currency.code] || 1.0;
  return (localPrice / rate).toFixed(2);
};

// Method to get currency symbol
settingsSchema.methods.getCurrencySymbol = function() {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$',
    'CHF': 'CHF',
    'CNY': '¥',
    'INR': '₹',
    'PKR': '₨'
  };
  return symbols[this.currency.code] || '$';
};

// Index for better performance
settingsSchema.index({ createdAt: 1 });

module.exports = mongoose.model("Settings", settingsSchema);