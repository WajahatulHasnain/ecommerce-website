const Coupon = require("../../models/Coupon");

exports.list = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { code, discount, type, minAmount, maxDiscount, expiryDate, usageLimit } = req.body;
    
    // Validate required fields
    if (!code || !discount || !type) {
      return res.status(400).json({ 
        success: false, 
        msg: "Code, discount, and type are required" 
      });
    }
    
    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ 
        success: false, 
        msg: "Coupon code already exists" 
      });
    }
    
    const couponData = {
      code: code.toUpperCase(),
      discount: Number(discount),
      type,
      minAmount: minAmount ? Number(minAmount) : 0,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      isActive: true
    };
    
    // Add maxDiscount for percentage coupons
    if (type === 'percentage' && maxDiscount) {
      couponData.maxDiscount = Number(maxDiscount);
    }
    
    // Add expiry date if provided
    if (expiryDate) {
      couponData.expiryDate = new Date(expiryDate);
    }
    
    const coupon = new Coupon(couponData);
    await coupon.save();
    
    res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, discount, type, minAmount, maxDiscount, expiryDate, usageLimit } = req.body;
    
    // Validate required fields
    if (!code || !discount || !type) {
      return res.status(400).json({ 
        success: false, 
        msg: "Code, discount, and type are required" 
      });
    }
    
    // Check if coupon exists
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ 
        success: false, 
        msg: "Coupon not found" 
      });
    }
    
    // Check if code already exists (excluding current coupon)
    const existingCoupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      _id: { $ne: id }
    });
    if (existingCoupon) {
      return res.status(400).json({ 
        success: false, 
        msg: "Coupon code already exists" 
      });
    }
    
    // Update coupon data
    coupon.code = code.toUpperCase();
    coupon.discount = Number(discount);
    coupon.type = type;
    coupon.minAmount = minAmount ? Number(minAmount) : 0;
    coupon.usageLimit = usageLimit ? Number(usageLimit) : null;
    
    // Handle maxDiscount for percentage coupons
    if (type === 'percentage' && maxDiscount) {
      coupon.maxDiscount = Number(maxDiscount);
    } else {
      coupon.maxDiscount = undefined;
    }
    
    // Handle expiry date
    if (expiryDate) {
      coupon.expiryDate = new Date(expiryDate);
    } else {
      coupon.expiryDate = undefined;
    }
    
    await coupon.save();
    
    res.json({ success: true, data: coupon });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, msg: "Coupon not found" });
    }
    
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    
    res.json({ success: true, data: coupon });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, msg: "Coupon not found" });
    }
    res.json({ success: true, msg: "Coupon deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

exports.validate = async (req, res) => {
  try {
    const { code } = req.params;
    const now = new Date();
    
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
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
    
    res.json({ success: true, data: coupon });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};
