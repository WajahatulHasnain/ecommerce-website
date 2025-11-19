const express = require("express");
const router = express.Router();
const { auth, adminOnly } = require("../middleware/auth");
const upload = require("../middleware/upload");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const { uploadToImgBB } = require("../utils/imgbbUpload");
const path = require("path");
const fs = require("fs");

// Apply auth and admin middleware to all routes
router.use(auth, adminOnly);

// Dashboard Analytics
router.get("/dashboard", async (req, res) => {
  try {
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalOrders = await Order.countDocuments();
    
    // Calculate revenue
    const revenueResult = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);
    const revenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    
    // Recent orders
    const recentOrders = await Order.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json({
      success: true,
      data: {
        totalCustomers,
        totalProducts, 
        totalOrders,
        revenue,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ success: false, msg: "Failed to fetch dashboard data" });
  }
});

// Products CRUD
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to fetch products" });
  }
});

router.post("/products", upload.single('image'), async (req, res) => {
  try {
    const { title, description, price, category, stock, tags, discount } = req.body;
    
    const productData = {
      title,
      description,
      price: Number(price),
      category,
      stock: Number(stock),
      createdBy: req.user.id,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    };
    
    // Handle discount data
    if (discount) {
      const discountData = typeof discount === 'string' ? JSON.parse(discount) : discount;
      if (discountData && (discountData.type === 'percentage' || discountData.type === 'fixed') && discountData.value > 0) {
        productData.discount = {
          type: discountData.type,
          value: Number(discountData.value),
          maxDiscount: discountData.maxDiscount ? Number(discountData.maxDiscount) : null,
          startDate: discountData.startDate || null,
          endDate: discountData.endDate || null
        };
      }
    }
    
    // Upload image to ImgBB if file was provided
    if (req.file) {
      try {
        const imageUrl = await uploadToImgBB(req.file.buffer, req.file.originalname);
        productData.imageUrl = imageUrl;
        console.log('Image uploaded to ImgBB:', imageUrl);
      } catch (imageError) {
        console.error('ImgBB upload failed:', imageError.message);
        return res.status(400).json({ 
          success: false, 
          msg: "Image upload failed: " + imageError.message 
        });
      }
    }
    
    const product = new Product(productData);
    await product.save();
    
    // Populate creator info for response
    await product.populate('createdBy', 'name email');
    
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(400).json({ success: false, msg: error.message });
  }
});

router.put("/products/:id", upload.single('image'), async (req, res) => {
  try {
    const { title, description, price, category, stock, tags, discount } = req.body;
    const productId = req.params.id;
    
    const updateData = {
      title,
      description,
      price: Number(price),
      category,
      stock: Number(stock),
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    };
    
    // Handle discount data
    if (discount !== undefined) {
      if (discount === null || discount === '') {
        // Remove discount
        updateData.discount = undefined;
        updateData.$unset = { discount: 1 };
      } else {
        const discountData = typeof discount === 'string' ? JSON.parse(discount) : discount;
        if (discountData && (discountData.type === 'percentage' || discountData.type === 'fixed') && discountData.value > 0) {
          updateData.discount = {
            type: discountData.type,
            value: Number(discountData.value),
            maxDiscount: discountData.maxDiscount ? Number(discountData.maxDiscount) : null,
            startDate: discountData.startDate || null,
            endDate: discountData.endDate || null
          };
        }
      }
    }
    
    // Handle image update
    if (req.file) {
      try {
        const imageUrl = await uploadToImgBB(req.file.buffer, req.file.originalname);
        updateData.imageUrl = imageUrl;
        console.log('Image updated on ImgBB:', imageUrl);
        
        // Note: We no longer delete old local files since we're using ImgBB
        // The old ImgBB images will remain accessible, which is fine for this implementation
      } catch (imageError) {
        console.error('ImgBB upload failed:', imageError.message);
        return res.status(400).json({ 
          success: false, 
          msg: "Image upload failed: " + imageError.message 
        });
      }
    }
    
    let product;
    if (updateData.$unset) {
      // Handle unsetting fields separately
      const { $unset, ...regularUpdate } = updateData;
      product = await Product.findByIdAndUpdate(
        productId,
        { $set: regularUpdate, $unset },
        { new: true, runValidators: true }
      ).populate('createdBy', 'name email');
    } else {
      product = await Product.findByIdAndUpdate(
        productId,
        updateData,
        { new: true, runValidators: true }
      ).populate('createdBy', 'name email');
    }
    
    if (!product) {
      return res.status(404).json({ success: false, msg: "Product not found" });
    }
    
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, msg: "Product not found" });
    }
    
    // Note: We don't delete images from ImgBB as they remain accessible
    // and there's no straightforward API to delete them with just the URL
    
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, msg: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to delete product" });
  }
});

// Orders Management
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email')
      .populate('products.productId', 'title')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to fetch orders" });
  }
});

router.put("/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('userId', 'name email');
    
    if (!order) {
      return res.status(404).json({ success: false, msg: "Order not found" });
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Users Management
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({ role: "customer" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Failed to fetch users" });
  }
});

// Mount coupon routes
router.use("/coupons", require("./admin/coupons"));

// Mount analytics routes  
router.use("/analytics", require("./admin/analytics"));

module.exports = router;
