const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

// Migration function
const migrateData = async () => {
  try {
    console.log("🚀 Starting data migration...");

    const db = mongoose.connection.db;

    // Check if collections exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);

    console.log("📊 Existing collections:", collectionNames);

    // Create unified users collection if it doesn't exist
    if (!collectionNames.includes('users')) {
      await db.createCollection('users');
      console.log("✅ Created users collection");
    }

    let migratedCount = 0;

    // Migrate from 'admins' collection if it exists
    if (collectionNames.includes('admins')) {
      const admins = await db.collection('admins').find({}).toArray();
      console.log(`📦 Found ${admins.length} admin records`);

      for (const admin of admins) {
        const existingUser = await db.collection('users').findOne({ email: admin.email });
        
        if (!existingUser) {
          await db.collection('users').insertOne({
            name: admin.name,
            email: admin.email,
            password: admin.password,
            role: "admin",
            isActive: true,
            createdAt: admin.createdAt || new Date(),
            updatedAt: admin.updatedAt || new Date()
          });
          migratedCount++;
        }
      }
      
      console.log(`✅ Migrated ${migratedCount} admin records`);
    }

    // Migrate from 'customers' collection if it exists
    if (collectionNames.includes('customers')) {
      const customers = await db.collection('customers').find({}).toArray();
      console.log(`📦 Found ${customers.length} customer records`);

      let customerMigrated = 0;
      for (const customer of customers) {
        const existingUser = await db.collection('users').findOne({ email: customer.email });
        
        if (!existingUser) {
          await db.collection('users').insertOne({
            name: customer.name,
            email: customer.email,
            password: customer.password,
            role: "customer",
            isActive: true,
            createdAt: customer.createdAt || new Date(),
            updatedAt: customer.updatedAt || new Date()
          });
          customerMigrated++;
        }
      }
      
      console.log(`✅ Migrated ${customerMigrated} customer records`);
    }

    // Create indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    console.log("✅ Created indexes");

    const totalUsers = await db.collection('users').countDocuments();
    console.log(`🎉 Migration completed! Total users: ${totalUsers}`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
};

// Run migration
const runMigration = async () => {
  await connectDB();
  await migrateData();
  await mongoose.connection.close();
  console.log("👋 Migration completed, connection closed");
};

// Execute if run directly
if (require.main === module) {
  runMigration();
}

module.exports = { migrateData };
