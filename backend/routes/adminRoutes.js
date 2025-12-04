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
const settingsController = require("../controllers/admin/settingsController");

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
    
    // Handle discount data - completely optional, skip if null/empty/invalid
    if (discount && discount !== '' && discount !== 'null' && discount !== 'undefined') {
      try {
        const discountData = typeof discount === 'string' ? JSON.parse(discount) : discount;
        if (discountData && 
            discountData.type && 
            (discountData.type === 'percentage' || discountData.type === 'fixed') && 
            discountData.value && 
            Number(discountData.value) > 0) {
          productData.discount = {
            type: discountData.type,
            value: Number(discountData.value),
            maxDiscount: discountData.maxDiscount ? Number(discountData.maxDiscount) : null,
            startDate: discountData.startDate || null,
            endDate: discountData.endDate || null
          };
        }
      } catch (parseError) {
        console.log('Discount parsing failed, proceeding without discount:', parseError.message);
      }
    }
    // If no valid discount data, product will be created without discount field
    
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
    const orderId = req.params.id;
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, msg: 'Invalid status' });
    }
    
    // Get the order first to check current state
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, msg: "Order not found" });
    }
    
    const updateData = { status };
    
    // Payment status logic for COD orders:
    // - Keep "pending" until order is "delivered"
    // - Only mark as "completed" when delivered
    if (order.paymentMethod === 'cod' || !order.paymentMethod || order.paymentMethod === 'cash_on_delivery') {
      if (status === 'delivered') {
        updateData.paymentStatus = 'completed'; // Mark as paid when delivered
      } else if (['pending', 'processing', 'shipped'].includes(status)) {
        updateData.paymentStatus = 'pending'; // Keep as pending for these statuses
      }
    }
    
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    ).populate('userId', 'name email');
    
    console.log(`✅ Order ${orderId} status updated to: ${status}${updateData.paymentStatus ? ', payment: ' + updateData.paymentStatus : ''}`);
    
    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(400).json({ success: false, msg: error.message });
  }
});

// Migrate all orders to COD payment method
router.post("/orders/migrate-to-cod", async (req, res) => {
  try {
    const result = await Order.updateMany(
      {}, // Update all orders
      { 
        paymentMethod: 'cod',
        paymentStatus: 'pending' // Set all to pending initially
      }
    );
    
    // Then update delivered orders to have completed payment status
    const deliveredResult = await Order.updateMany(
      { status: 'delivered', paymentMethod: 'cod' },
      { paymentStatus: 'completed' }
    );

    console.log(`🔄 Updated ${result.modifiedCount} orders to COD payment method`);
    console.log(`✅ Updated ${deliveredResult.modifiedCount} delivered orders to completed payment`);

    res.json({ 
      success: true, 
      msg: `Updated ${result.modifiedCount} orders to COD. ${deliveredResult.modifiedCount} delivered orders marked as paid.`,
      modifiedCount: result.modifiedCount,
      deliveredUpdated: deliveredResult.modifiedCount
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ success: false, msg: 'Failed to migrate orders to COD' });
  }
});

// Users Management
router.get("/users", async (req, res) => {
  try {
    // ✅ Enhanced: Fetch from both Customer and User collections for complete data
    const Customer = require("../models/Customer");
    
    const customers = await Customer.find()
      .select("-password -resetCode -resetCodeExpiry -resetToken")
      .lean();
    
    const users = await User.find({ role: "customer" })
      .select("-password")
      .lean();
    
    // ✅ Enhanced: Combine and normalize data
    const allCustomers = [
      ...customers.map(customer => ({
        ...customer,
        source: 'customer_collection',
        lastUpdated: customer.updatedAt
      })),
      ...users.map(user => ({
        ...user,
        source: 'user_collection',
        lastUpdated: user.updatedAt
      }))
    ];
    
    // ✅ Enhanced: Sort by most recently updated
    allCustomers.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    
    console.log(`✅ Admin fetched ${allCustomers.length} total customers (${customers.length} from Customer collection, ${users.length} from User collection)`);
    
    res.json({
      success: true,
      data: allCustomers,
      meta: {
        totalCustomers: allCustomers.length,
        fromCustomerCollection: customers.length,
        fromUserCollection: users.length,
        lastSync: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    res.status(500).json({ success: false, msg: "Failed to fetch users" });
  }
});

// Settings routes
router.get("/settings", settingsController.getSettings);
router.put("/settings", settingsController.updateSettings);
router.post("/settings/reset", settingsController.resetSettings);

// Mount coupon routes
router.use("/coupons", require("./admin/coupons"));

// Mount analytics routes  
router.use("/analytics", require("./admin/analytics"));

module.exports = router;
