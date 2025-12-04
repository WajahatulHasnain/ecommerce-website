const express = require("express");
const router = express.Router();
const { auth, customerOnly } = require("../middleware/auth");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const Customer = require("../models/Customer");
const Wishlist = require("../models/Wishlist");
const Cart = require("../models/Cart");
const Settings = require("../models/Settings");
const mongoose = require("mongoose");

// Public route to get store settings (no auth required)
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

// Apply auth and customer middleware to protected routes
router.use(auth, customerOnly);

// Dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get customer statistics
    const totalOrders = await Order.countDocuments({ userId });
    const totalSpentResult = await Order.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);
    const totalSpent = totalSpentResult.length > 0 ? totalSpentResult[0].total : 0;
    
    // Get real cart and wishlist counts
    const cartCount = await Cart.countDocuments({ userId });
    const wishlistCount = await Wishlist.countDocuments({ userId });
    
    const recentOrders = await Order.find({ userId })
      .populate('products.productId', 'title imageUrl')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const dashboardData = {
      totalOrders,
      totalSpent,
      recentOrders,
      wishlistCount,
      cartCount
    };
    
    res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Customer dashboard error:', error);
    res.status(500).json({ success: false, msg: "Failed to fetch dashboard data" });
  }
});

// Products Browsing
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
    
    console.log(`📦 Fetched ${products.length} products for customer`);
    
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
    console.error('Products fetch error:', error);
    res.status(500).json({ success: false, msg: "Failed to fetch products" });
  }
});

// Single Product
router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findOne({ 
      _id: req.params.id, 
      isActive: true 
    }).populate('createdBy', 'name');
    
    if (!product) {
      return res.status(404).json({ success: false, msg: "Product not found" });
    }
    
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to fetch product" });
  }
});

// Purchase Products
router.post("/purchase", async (req, res) => {
  try {
    console.log('🛒 Purchase request received:', { userId: req.user._id, products: req.body.products?.length });
    
    const { products, customerInfo, coupon, subtotal, discount, finalTotal } = req.body;
    const userId = req.user._id;
    
    if (!products || products.length === 0) {
      console.log('❌ No products provided');
      return res.status(400).json({ success: false, msg: "No products to purchase" });
    }
    
    // Validate customer info
    if (!customerInfo?.name || !customerInfo?.email || !customerInfo?.phone || 
        !customerInfo?.address?.street || !customerInfo?.address?.city) {
      console.log('❌ Missing customer information');
      return res.status(400).json({ 
        success: false, 
        msg: "Please provide complete customer information" 
      });
    }
    
    let calculatedTotal = 0;
    const orderProducts = [];
    
    console.log('📦 Validating products...');
    
    // Validate products and calculate total
    for (const item of products) {
      const product = await Product.findById(item.productId);
      
      if (!product || !product.isActive) {
        console.log('❌ Product not found or inactive:', item.productId);
        return res.status(400).json({ 
          success: false, 
          msg: `Product ${item.productId} not found or inactive` 
        });
      }
      
      if (product.stock < item.qty) {
        console.log('❌ Insufficient stock:', { product: product.title, requested: item.qty, available: product.stock });
        return res.status(400).json({ 
          success: false, 
          msg: `Insufficient stock for ${product.title}. Available: ${product.stock}, Requested: ${item.qty}` 
        });
      }
      
      // Use finalPrice which accounts for discounts
      const effectivePrice = product.finalPrice;
      const itemTotal = effectivePrice * item.qty;
      calculatedTotal += itemTotal;
      
      console.log('✅ Product validated:', { 
        title: product.title, 
        originalPrice: product.price, 
        finalPrice: effectivePrice, 
        qty: item.qty, 
        itemTotal 
      });
      
      orderProducts.push({
        productId: product._id,
        title: product.title,
        quantity: item.qty,
        price: effectivePrice, // Use effective price (with discount)
        originalPrice: product.price, // Store original price for reference
        imageUrl: product.imageUrl
      });
    }
    
    console.log('💰 Calculated subtotal:', calculatedTotal);
    
    // Update stock for all products (do this before coupon validation to avoid stock issues)
    console.log('📦 Updating product stock...');
    for (let i = 0; i < products.length; i++) {
      const item = products[i];
      const product = await Product.findById(item.productId);
      
      // Double-check stock before reducing (in case of concurrent purchases)
      if (product.stock < item.qty) {
        console.log('❌ Stock changed during processing:', { product: product.title, available: product.stock, requested: item.qty });
        return res.status(400).json({ 
          success: false, 
          msg: `Stock changed during processing for ${product.title}. Please try again.` 
        });
      }
      
      // Reduce stock using findByIdAndUpdate to avoid validation issues
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.qty } },
        { runValidators: false }
      );
      
      console.log('✅ Stock updated:', { product: product.title, reducedBy: item.qty, newStock: product.stock - item.qty });
    }
    
    // Validate coupon if provided
    let appliedDiscount = 0;
    let couponDetails = null;
    
    if (coupon && coupon.code) {
      console.log('🏷️ Validating coupon:', coupon.code);
      
      const Coupon = require("../models/Coupon");
      const validCoupon = await Coupon.findOne({
        code: coupon.code.toUpperCase(),
        isActive: true,
        $or: [
          { expiryDate: null },
          { expiryDate: { $gte: new Date() } }
        ]
      });
      
      if (!validCoupon) {
        console.log('❌ Invalid coupon:', coupon.code);
        return res.status(400).json({ success: false, msg: "Invalid or expired coupon" });
      }
      
      // Check usage limit
      if (validCoupon.usageLimit && validCoupon.usedCount >= validCoupon.usageLimit) {
        console.log('❌ Coupon usage limit exceeded:', coupon.code);
        return res.status(400).json({ success: false, msg: "Coupon usage limit exceeded" });
      }
      
      // Check minimum amount
      if (validCoupon.minAmount && calculatedTotal < validCoupon.minAmount) {
        console.log('❌ Minimum amount not met:', { required: validCoupon.minAmount, actual: calculatedTotal });
        return res.status(400).json({ 
          success: false, 
          msg: `Minimum order amount $${validCoupon.minAmount} required` 
        });
      }
      
      // Calculate discount
      if (validCoupon.type === 'percentage') {
        appliedDiscount = (calculatedTotal * validCoupon.discount) / 100;
        if (validCoupon.maxDiscount && appliedDiscount > validCoupon.maxDiscount) {
          appliedDiscount = validCoupon.maxDiscount;
        }
      } else {
        appliedDiscount = Math.min(validCoupon.discount, calculatedTotal);
      }
      
      console.log('✅ Coupon applied:', { code: coupon.code, discount: appliedDiscount });
      
      // Update coupon usage count
      validCoupon.usedCount += 1;
      await validCoupon.save();
      
      couponDetails = {
        code: validCoupon.code,
        type: validCoupon.type,
        discount: validCoupon.discount,
        appliedDiscount
      };
    }
    
    const totalPrice = Math.max(0, calculatedTotal - appliedDiscount);
    
    console.log('💳 Order totals:', { subtotal: calculatedTotal, discount: appliedDiscount, finalTotal: totalPrice });
    
    // Create order
    console.log('📋 Creating order without orderNumber (will be auto-generated)...');
    
    const order = new Order({
      userId,
      products: orderProducts,
      totalPrice,
      subtotal: calculatedTotal,
      discount: appliedDiscount,
      coupon: couponDetails,
      customerInfo: {
        name: customerInfo.name?.trim(),
        email: customerInfo.email?.trim().toLowerCase(),
        phone: customerInfo.phone?.trim(),
        address: {
          street: customerInfo.address.street?.trim(),
          city: customerInfo.address.city?.trim(),
          state: customerInfo.address.state?.trim(),
          zipCode: customerInfo.address.zipCode?.trim(),
          country: customerInfo.address.country?.trim() || 'USA'
        }
      },
      status: 'pending',
      paymentStatus: 'completed', // Assuming immediate payment for now
      paymentMethod: 'credit_card'
    });
    
    await order.save();
    console.log('✅ Order created successfully:', order._id, 'with order number:', order.orderNumber);
    
    // Populate user data for response
    await order.populate('userId', 'name email');
    await order.populate('products.productId', 'title imageUrl category');
    
    console.log('🎉 Purchase completed successfully for order:', order.displayOrderId);
    
    res.status(201).json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.displayOrderId, // Use the virtual field for display
        totalPrice: order.totalPrice,
        products: order.products,
        customerInfo: order.customerInfo,
        status: order.status
      },
      msg: "Order placed successfully! Thank you for your purchase."
    });
    
  } catch (error) {
    console.error('❌ Purchase error:', error);
    
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        msg: "Validation Error: " + messages.join(', ')
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        msg: "Invalid product ID format"
      });
    }
    
    res.status(500).json({ 
      success: false, 
      msg: "Failed to process purchase. Please try again.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Customer Orders
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('products.productId', 'title imageUrl')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to fetch orders" });
  }
});

// Password change for customers
router.put("/password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        msg: "Current password and new password are required" 
      });
    }
    
    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        msg: "New password must be at least 6 characters long" 
      });
    }
    
    let user;
    
    // Get user with password field for verification
    if (req.user.role === 'customer') {
      user = await Customer.findById(req.user._id);
    } else {
      user = await User.findById(req.user._id);
    }
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        msg: "User not found" 
      });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        success: false, 
        msg: "Current password is incorrect" 
      });
    }
    
    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();
    
    console.log('✅ Password updated successfully for user:', user.email);
    
    res.json({ 
      success: true, 
      msg: "Password updated successfully" 
    });
    
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ 
      success: false, 
      msg: "Failed to update password" 
    });
  }
});

// Wishlist Management
router.get("/wishlist", async (req, res) => {
  try {
    const wishlistItems = await Wishlist.find({ userId: req.user._id })
      .populate('productId', 'title description price imageUrl category stock isActive')
      .sort({ createdAt: -1 });
    
    // Filter out products that are no longer active
    const activeWishlist = wishlistItems.filter(item => 
      item.productId && item.productId.isActive
    );
    
    res.json({ success: true, data: activeWishlist });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to fetch wishlist" });
  }
});

router.post("/wishlist/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;
    
    // Check if product exists and is active
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return res.status(404).json({ success: false, msg: "Product not found" });
    }
    
    // Check if already in wishlist
    const existingWishlistItem = await Wishlist.findOne({ userId, productId });
    if (existingWishlistItem) {
      return res.status(400).json({ success: false, msg: "Product already in wishlist" });
    }
    
    // Add to wishlist
    const wishlistItem = new Wishlist({ userId, productId });
    await wishlistItem.save();
    await wishlistItem.populate('productId', 'title description price imageUrl category stock');
    
    res.status(201).json({ success: true, data: wishlistItem, msg: "Added to wishlist" });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to add to wishlist" });
  }
});

router.delete("/wishlist/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;
    
    const deleted = await Wishlist.findOneAndDelete({ userId, productId });
    if (!deleted) {
      return res.status(404).json({ success: false, msg: "Item not found in wishlist" });
    }
    
    res.json({ success: true, msg: "Removed from wishlist" });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to remove from wishlist" });
  }
});

// Coupon validation for customers
router.get("/coupons/validate/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const now = new Date();
    const Coupon = require("../models/Coupon");
    
    // ✅ Enhanced: Convert to uppercase for case-insensitive comparison
    const normalizedCode = code.toUpperCase().trim();
    
    const coupon = await Coupon.findOne({
      code: normalizedCode, // ✅ Use normalized code
      isActive: true,
      $or: [
        { expiryDate: null },
        { expiryDate: { $gte: now } }
      ]
    });
    
    if (!coupon) {
      return res.status(404).json({ success: false, msg: "Coupon invalid or expired" });
    }
    
    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, msg: "Coupon usage limit exceeded" });
    }
    
    console.log(`✅ Coupon validated: ${normalizedCode} for customer ${req.user.email}`);
    res.json({ success: true, data: coupon });
  } catch (error) {
    console.error('Coupon validation error:', error);
    res.status(500).json({ success: false, msg: "Failed to validate coupon" });
  }
});

// Cart Management
router.get("/cart", async (req, res) => {
  try {
    const cartItems = await Cart.find({ userId: req.user._id })
      .populate('productId', 'title description price imageUrl category stock isActive')
      .sort({ createdAt: -1 });
    
    // Filter out products that are no longer active
    const activeCart = cartItems.filter(item => 
      item.productId && item.productId.isActive && item.productId.stock > 0
    );
    
    res.json({ success: true, data: activeCart });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to fetch cart" });
  }
});

router.post("/cart/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity = 1 } = req.body;
    const userId = req.user._id;
    
    // Check if product exists and is active
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return res.status(404).json({ success: false, msg: "Product not found" });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, msg: "Insufficient stock" });
    }
    
    // Check if already in cart
    const existingCartItem = await Cart.findOne({ userId, productId });
    if (existingCartItem) {
      // Update quantity
      const newQuantity = existingCartItem.quantity + quantity;
      if (product.stock < newQuantity) {
        return res.status(400).json({ success: false, msg: "Insufficient stock" });
      }
      
      existingCartItem.quantity = newQuantity;
      await existingCartItem.save();
      await existingCartItem.populate('productId', 'title description price imageUrl category stock');
      
      return res.json({ success: true, data: existingCartItem, msg: "Cart updated" });
    }
    
    // Add to cart
    const cartItem = new Cart({ userId, productId, quantity });
    await cartItem.save();
    await cartItem.populate('productId', 'title description price imageUrl category stock');
    
    res.status(201).json({ success: true, data: cartItem, msg: "Added to cart" });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to add to cart" });
  }
});

router.put("/cart/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.user._id;
    
    if (quantity < 1) {
      return res.status(400).json({ success: false, msg: "Quantity must be at least 1" });
    }
    
    const cartItem = await Cart.findOne({ userId, productId });
    if (!cartItem) {
      return res.status(404).json({ success: false, msg: "Item not found in cart" });
    }
    
    // Check stock
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, msg: "Product not found" });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, msg: "Insufficient stock" });
    }
    
    cartItem.quantity = quantity;
    await cartItem.save();
    await cartItem.populate('productId', 'title description price imageUrl category stock');
    
    res.json({ success: true, data: cartItem, msg: "Cart updated" });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to update cart" });
  }
});

router.delete("/cart/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;
    
    const deleted = await Cart.findOneAndDelete({ userId, productId });
    if (!deleted) {
      return res.status(404).json({ success: false, msg: "Item not found in cart" });
    }
    
    res.json({ success: true, msg: "Removed from cart" });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to remove from cart" });
  }
});

router.delete("/cart", async (req, res) => {
  try {
    const userId = req.user._id;
    await Cart.deleteMany({ userId });
    res.json({ success: true, msg: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to clear cart" });
  }
});

module.exports = router;
