const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAPI() {
  try {
    console.log('🧪 Testing API functionality...\n');
    
    // Test 1: Admin login
    console.log('1. Testing admin login...');
    const adminLogin = await axios.post(`${API_BASE}/auth/admin/login`, {
      email: 'wajahatsardar714@gmail.com',
      password: 'admin123'
    });
    
    if (adminLogin.data.success) {
      console.log('✅ Admin login successful');
      const adminToken = adminLogin.data.token;
      
      // Test 2: Create a product
      console.log('\n2. Testing product creation...');
      const productData = {
        title: 'Test Product ' + Date.now(),
        description: 'This is a test product for API verification',
        price: 29.99,
        category: 'electronics',
        stock: 10,
        tags: 'test,api,verification'
      };
      
      const productResponse = await axios.post(`${API_BASE}/admin/products`, productData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (productResponse.data.success) {
        console.log('✅ Product creation successful');
        console.log('   Product ID:', productResponse.data.data._id);
        
        // Test 3: Fetch products
        console.log('\n3. Testing product fetch...');
        const productsResponse = await axios.get(`${API_BASE}/admin/products`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (productsResponse.data.success) {
          console.log('✅ Product fetch successful');
          console.log('   Total products:', productsResponse.data.data.length);
        } else {
          console.log('❌ Product fetch failed');
        }
      } else {
        console.log('❌ Product creation failed');
        console.log('   Error:', productResponse.data.msg);
      }
    } else {
      console.log('❌ Admin login failed');
    }
    
    // Test 4: Customer registration and login
    console.log('\n4. Testing customer registration...');
    const customerData = {
      name: 'Test Customer',
      email: `test.customer.${Date.now()}@example.com`,
      password: 'customer123',
      phone: '1234567890'
    };
    
    try {
      await axios.post(`${API_BASE}/customer/register`, customerData);
      console.log('✅ Customer registration successful');
      
      // Test customer login
      console.log('\n5. Testing customer login...');
      const customerLogin = await axios.post(`${API_BASE}/customer/login`, {
        email: customerData.email,
        password: customerData.password
      });
      
      if (customerLogin.data.success) {
        console.log('✅ Customer login successful');
        const customerToken = customerLogin.data.token;
        
        // Test 6: Browse products as customer
        console.log('\n6. Testing customer product browsing...');
        const customerProducts = await axios.get(`${API_BASE}/customer/products`, {
          headers: { Authorization: `Bearer ${customerToken}` }
        });
        
        if (customerProducts.data.success) {
          console.log('✅ Customer product browsing successful');
          console.log('   Available products:', customerProducts.data.data.products.length);
        } else {
          console.log('❌ Customer product browsing failed');
        }
      } else {
        console.log('❌ Customer login failed');
      }
    } catch (regError) {
      console.log('⚠️ Customer registration failed (might already exist)');
    }
    
    console.log('\n🎉 API tests completed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.response?.data?.msg || error.message);
  }
}

testAPI();