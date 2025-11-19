const mongoose = require("mongoose");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const User = require("../models/User");
const connectDB = require("../config/db");

const seedTestData = async () => {
  try {
    console.log("🌱 Seeding test data...");
    
    await connectDB();
    
    // Find admin user
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      console.log("❌ No admin user found");
      return;
    }
    
    console.log("👤 Admin found:", admin.email);
    
    // Create test products
    const testProducts = [
      {
        title: "Gaming Laptop Pro",
        description: "High-performance gaming laptop with RGB keyboard and advanced cooling system",
        price: 1299.99,
        category: "electronics",
        stock: 15,
        createdBy: admin._id,
        imageUrl: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400",
        discount: {
          type: "percentage",
          value: 20,
          maxDiscount: 300
        },
        tags: ["gaming", "laptop", "rgb", "performance"]
      },
      {
        title: "Wireless Headphones",
        description: "Premium noise-cancelling wireless headphones with 30-hour battery life",
        price: 199.99,
        category: "electronics",
        stock: 25,
        createdBy: admin._id,
        imageUrl: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400",
        discount: {
          type: "fixed",
          value: 50
        },
        tags: ["headphones", "wireless", "noise-cancelling"]
      },
      {
        title: "Smart Watch",
        description: "Advanced fitness tracking smartwatch with heart rate monitor",
        price: 299.99,
        category: "electronics",
        stock: 30,
        createdBy: admin._id,
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
        tags: ["smartwatch", "fitness", "tracking"]
      },
      {
        title: "Casual T-Shirt",
        description: "Comfortable cotton t-shirt perfect for everyday wear",
        price: 24.99,
        category: "clothing",
        stock: 50,
        createdBy: admin._id,
        imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
        discount: {
          type: "percentage",
          value: 15
        },
        tags: ["tshirt", "cotton", "casual"]
      },
      {
        title: "Home Coffee Maker",
        description: "Professional-grade coffee maker for the perfect morning brew",
        price: 89.99,
        category: "home",
        stock: 20,
        createdBy: admin._id,
        imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
        tags: ["coffee", "maker", "kitchen"]
      }
    ];
    
    // Check if products already exist
    const existingProducts = await Product.countDocuments();
    if (existingProducts < 3) {
      console.log("📦 Creating test products...");
      await Product.deleteMany({}); // Clear existing
      await Product.insertMany(testProducts);
      console.log(`✅ Created ${testProducts.length} test products`);
    } else {
      console.log("✅ Products already exist, skipping creation");
    }
    
    // Create test coupons
    const testCoupons = [
      {
        code: "SAVE10",
        discount: 10,
        type: "percentage",
        minAmount: 50,
        maxDiscount: 100,
        usageLimit: 100,
        isActive: true
      },
      {
        code: "WELCOME20",
        discount: 20,
        type: "fixed",
        minAmount: 100,
        usageLimit: 50,
        isActive: true
      },
      {
        code: "BIGDEAL",
        discount: 25,
        type: "percentage",
        minAmount: 200,
        maxDiscount: 150,
        usageLimit: 20,
        isActive: true
      }
    ];
    
    // Check if coupons already exist
    const existingCoupons = await Coupon.countDocuments();
    if (existingCoupons < 2) {
      console.log("🏷️ Creating test coupons...");
      await Coupon.deleteMany({}); // Clear existing
      await Coupon.insertMany(testCoupons);
      console.log(`✅ Created ${testCoupons.length} test coupons`);
    } else {
      console.log("✅ Coupons already exist, skipping creation");
    }
    
    console.log("\n🎉 Test data seeding completed successfully!");
    console.log("\n📋 Available test coupons:");
    testCoupons.forEach(coupon => {
      console.log(`   ${coupon.code}: ${coupon.discount}${coupon.type === 'percentage' ? '%' : '$'} off (min: $${coupon.minAmount})`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error("❌ Error seeding test data:", error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedTestData();
}

module.exports = seedTestData;