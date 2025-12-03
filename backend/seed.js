const mongoose = require('mongoose');
require('dotenv').config();

// Connect to the database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const Product = require('./models/Product');
const Settings = require('./models/Settings');

async function seedData() {
  try {
    // Check if settings exist, if not create them
    const settings = await Settings.getSettings();
    console.log('✅ Settings initialized');

    // Check if products exist
    const productCount = await Product.countDocuments();
    console.log(`📦 Found ${productCount} products in database`);

    if (productCount === 0) {
      console.log('🌱 Seeding sample products...');
      
      const sampleProducts = [
        {
          title: 'Wireless Bluetooth Headphones',
          description: 'High-quality wireless headphones with noise cancellation and long battery life.',
          price: 99.99,
          category: 'Electronics',
          stock: 50,
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
          isActive: true,
          tags: ['audio', 'wireless', 'electronics']
        },
        {
          title: 'Organic Cotton T-Shirt',
          description: 'Comfortable and sustainable organic cotton t-shirt in various colors.',
          price: 29.99,
          category: 'Clothing',
          stock: 100,
          image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
          isActive: true,
          tags: ['clothing', 'organic', 'cotton']
        },
        {
          title: 'Artisan Coffee Mug',
          description: 'Hand-crafted ceramic coffee mug perfect for your morning brew.',
          price: 19.99,
          category: 'Home & Kitchen',
          stock: 30,
          image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=500',
          isActive: true,
          tags: ['kitchen', 'coffee', 'ceramic']
        },
        {
          title: 'Fitness Yoga Mat',
          description: 'Non-slip yoga mat made from eco-friendly materials.',
          price: 39.99,
          category: 'Sports & Fitness',
          stock: 25,
          image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500',
          isActive: true,
          tags: ['fitness', 'yoga', 'exercise']
        },
        {
          title: 'Leather Wallet',
          description: 'Premium leather wallet with multiple card slots and RFID protection.',
          price: 79.99,
          category: 'Accessories',
          stock: 40,
          image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
          isActive: true,
          tags: ['leather', 'wallet', 'accessories']
        }
      ];

      await Product.insertMany(sampleProducts);
      console.log(`✅ Added ${sampleProducts.length} sample products`);
    }

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedData();