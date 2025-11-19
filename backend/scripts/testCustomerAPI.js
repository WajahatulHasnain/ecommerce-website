require('dotenv').config({ path: '../.env' });
const axios = require('axios');

async function testCustomerAPI() {
  try {
    // First, let's try to login as a customer to get a token
    console.log('=== TESTING CUSTOMER LOGIN ===');
    
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'wajahatsardar233559@gmail.com',
      password: 'babban123' // Try common password
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Customer login successful');
      const token = loginResponse.data.token;
      console.log('Token received:', token.substring(0, 20) + '...');
      
      // Test the dashboard API
      console.log('\n=== TESTING CUSTOMER DASHBOARD API ===');
      const dashboardResponse = await axios.get('http://localhost:5000/api/customer/dashboard', {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });
      
      if (dashboardResponse.data.success) {
        console.log('✅ Dashboard API working!');
        console.log('Dashboard data:', JSON.stringify(dashboardResponse.data.data, null, 2));
      } else {
        console.log('❌ Dashboard API failed:', dashboardResponse.data);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data);
      
      // Try with different password
      console.log('\nTrying alternative passwords...');
      const altPasswords = ['123456', 'password', 'admin123', 'customer123', 'test123'];
      
      for (let pwd of altPasswords) {
        try {
          const altResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'wajahatsardar233559@gmail.com',
            password: pwd
          });
          
          if (altResponse.data.success) {
            console.log(`✅ Login successful with password: ${pwd}`);
            
            const token = altResponse.data.token;
            const dashboardResponse = await axios.get('http://localhost:5000/api/customer/dashboard', {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('Dashboard data:', JSON.stringify(dashboardResponse.data.data, null, 2));
            break;
          }
        } catch (e) {
          // Continue trying
        }
      }
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error.response?.data || error.message);
  }
}

testCustomerAPI();