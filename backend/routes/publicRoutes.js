const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Settings = require("../models/Settings");

// Public Products Browsing for guests (no authentication required)
router.get("/products", async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, page = 1, limit = 12 } = req.query;
    
    let query = { isActive: true, stock: { $gt: 0 } };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    // Include virtual fields in response
    const productsWithFinalPrice = products.map(product => {
      const productObj = product.toObject({ virtuals: true });
      return {
        ...productObj,
        finalPrice: product.finalPrice,
        discountAmount: product.discountAmount,
        discountPercentage: product.discountPercentage,
        isDiscountActive: product.isDiscountActive()
      };
    });
    
    const total = await Product.countDocuments(query);
    
    console.log(`🌍 Public: Fetched ${products.length} products for guest`);
    
    res.json({ 
      success: true, 
      data: {
        products: productsWithFinalPrice,
        pagination: {
          current: Number(page),
          total: Math.ceil(total / limit),
          totalProducts: total
        }
      }
    });
  } catch (error) {
    console.error('Public products fetch error:', error);
    res.status(500).json({ success: false, msg: "Failed to fetch products" });
  }
});

// Public single product view
router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id, 
      isActive: true 
    }).populate('createdBy', 'name');
    
    if (!product) {
      return res.status(404).json({ success: false, msg: "Product not found" });
    }
    
    // Include virtual fields
    const productWithFinalPrice = {
      ...product.toObject({ virtuals: true }),
      finalPrice: product.finalPrice,
      discountAmount: product.discountAmount,
      discountPercentage: product.discountPercentage,
      isDiscountActive: product.isDiscountActive()
    };
    
    res.json({ success: true, data: productWithFinalPrice });
  } catch (error) {
    console.error('Public product fetch error:', error);
    res.status(500).json({ success: false, msg: "Failed to fetch product" });
  }
});

// Public store settings
router.get("/settings", async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    // Return only public settings with currency symbol
    const currencySymbol = settings.getCurrencySymbol();
    const publicSettings = {
      storeName: settings.storeName,
      storeDescription: settings.storeDescription,
      currency: {
        code: settings.currency.code,
        symbol: currencySymbol,
        rate: settings.currency.rate
      },
      taxRate: settings.taxRate,
      shippingFee: settings.shippingFee,
      freeShippingThreshold: settings.freeShippingThreshold,
      exchangeRates: settings.exchangeRates
    };
    res.json({ success: true, data: publicSettings });
  } catch (error) {
    console.error('Public settings fetch error:', error);
    res.status(500).json({ success: false, msg: "Failed to fetch settings" });
  }
});

module.exports = router;