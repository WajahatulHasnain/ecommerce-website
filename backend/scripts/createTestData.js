require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

async function createTestData() {
  try {
    const uri = process.env.MONGO_URI;
    await mongoose.connect(uri);
    
    console.log('Connected to database');
    
    // Find all users from User model
    const users = await User.find({});
    console.log('\n=== USERS (User Model) ===');
    console.log('Total users:', users.length);
    users.forEach(u => console.log('User ID:', u._id.toString(), '| Email:', u.email, '| Role:', u.role));
    
    // Find all customers from Customer model  
    const customers = await Customer.find({});
    console.log('\n=== CUSTOMERS (Customer Model) ===');
    console.log('Total customers:', customers.length);
    customers.forEach(c => console.log('Customer ID:', c._id.toString(), '| Email:', c.email, '| Name:', c.name));
    
    // Check products
    const products = await Product.find({}).limit(5);
    console.log('\n=== PRODUCTS ===');
    console.log('Total products:', products.length);
    products.slice(0, 3).forEach(p => console.log('Product:', p._id.toString(), '| Title:', p.title, '| Price: $' + p.price));
    
    if ((customers.length > 0 || users.filter(u => u.role === 'customer').length > 0) && products.length > 0) {
      // Use customer from Customer model if available, otherwise use customer from User model
      const customer = customers[0] || users.find(u => u.role === 'customer');
      const customerId = customer._id;
      console.log('\n=== CUSTOMER DATA FOR:', customer.email, '===');
      
      // Check existing data
      const cartItems = await Cart.find({ userId: customerId });
      console.log('Cart items:', cartItems.length);
      
      const wishlistItems = await Wishlist.find({ userId: customerId });
      console.log('Wishlist items:', wishlistItems.length);
      
      const orders = await Order.find({ userId: customerId });
      console.log('Orders:', orders.length);
      
      console.log('\n=== CREATING TEST DATA ===');
      
      // Create cart items
      if (cartItems.length === 0) {
        try {
          await Cart.create({ userId: customerId, productId: products[0]._id, quantity: 2 });
          if (products[1]) await Cart.create({ userId: customerId, productId: products[1]._id, quantity: 1 });
          if (products[2]) await Cart.create({ userId: customerId, productId: products[2]._id, quantity: 3 });
          console.log('✅ Cart items created');
        } catch (e) { console.log('Cart creation error:', e.message); }
      }
      
      // Create wishlist items
      if (wishlistItems.length === 0) {
        try {
          await Wishlist.create({ userId: customerId, productId: products[0]._id });
          if (products[2]) await Wishlist.create({ userId: customerId, productId: products[2]._id });
          if (products[3]) await Wishlist.create({ userId: customerId, productId: products[3]._id });
          console.log('✅ Wishlist items created');
        } catch (e) { console.log('Wishlist creation error:', e.message); }
      }
      
      // Create test orders
      if (orders.length === 0) {
        try {
          // Create a completed order
          await Order.create({
            userId: customerId,
            products: [{
              productId: products[0]._id,
              title: products[0].title || 'Test Product 1',
              quantity: 1,
              price: products[0].price || 29.99,
              imageUrl: products[0].imageUrl || ''
            }],
            subtotal: products[0].price || 29.99,
            totalPrice: products[0].price || 29.99,
            status: 'completed',
            paymentStatus: 'completed',
            customerInfo: {
              name: customer.name || customer.username || 'Test Customer',
              email: customer.email,
              phone: '123-456-7890',
              address: {
                street: '123 Test Street',
                city: 'Test City',
                state: 'Test State',
                zipCode: '12345',
                country: 'USA'
              }
            }
          });
          
          // Create a processing order
          if (products[1]) {
            await Order.create({
              userId: customerId,
              products: [{
                productId: products[1]._id,
                title: products[1].title || 'Test Product 2',
                quantity: 2,
                price: products[1].price || 39.99,
                imageUrl: products[1].imageUrl || ''
              }],
              subtotal: (products[1].price || 39.99) * 2,
              totalPrice: (products[1].price || 39.99) * 2,
              status: 'processing',
              paymentStatus: 'completed',
              customerInfo: {
                name: customer.name || customer.username || 'Test Customer',
                email: customer.email,
                phone: '123-456-7890',
                address: {
                  street: '123 Test Street',
                  city: 'Test City',
                  state: 'Test State',
                  zipCode: '12345',
                  country: 'USA'
                }
              }
            });
          }
          
          console.log('✅ Test orders created');
        } catch (e) { console.log('Order creation error:', e.message); }
      }
      
      // Verify data was created
      console.log('\n=== VERIFICATION ===');
      const newCartCount = await Cart.countDocuments({ userId: customerId });
      const newWishlistCount = await Wishlist.countDocuments({ userId: customerId });
      const newOrderCount = await Order.countDocuments({ userId: customerId });
      
      console.log('Final Cart items:', newCartCount);
      console.log('Final Wishlist items:', newWishlistCount);  
      console.log('Final Orders:', newOrderCount);
      
      // Calculate total spent
      const totalSpentResult = await Order.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(customerId), status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
      ]);
      const totalSpent = totalSpentResult.length > 0 ? totalSpentResult[0].total : 0;
      console.log('Total spent: $' + totalSpent.toFixed(2));
      
    } else {
      console.log('❌ Need both customers/users and products in database');
      console.log('Customers found:', customers.length);
      console.log('Customer users found:', users.filter(u => u.role === 'customer').length);
      console.log('Products found:', products.length);
      
      if (users.filter(u => u.role === 'customer').length === 0 && customers.length === 0) {
        console.log('\n🔴 NO CUSTOMERS REGISTERED!');
        console.log('Please register a customer account first by:');
        console.log('1. Go to the frontend (http://localhost:5173)');
        console.log('2. Click Sign Up');
        console.log('3. Register as a customer');
        console.log('4. Then run this script again');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createTestData();