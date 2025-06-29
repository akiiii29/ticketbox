const http = require('http');

const BASE_URL = 'localhost';
const BASE_PORT = 3000;
const BASE_PATH = '/api';

let authToken = null;

// Test helper functions
const makeRequest = (method, path, data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: BASE_URL,
      port: BASE_PORT,
      path: `${BASE_PATH}${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            status: res.statusCode,
            data: parsedData,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
};

const testEndpoint = async (method, endpoint, data = null, token = null) => {
  try {
    const result = await makeRequest(method, endpoint, data, token);
    console.log(`✅ ${method} ${endpoint} - Status: ${result.status}`);
    return result;
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Test all endpoints
const runTests = async () => {
  console.log('🚀 Starting API Endpoint Tests...\n');

  // 1. Health Check
  console.log('📋 1. Health Check');
  await testEndpoint('GET', '/health');
  console.log('');

  // 2. Public Events (no auth required)
  console.log('📋 2. Public Events');
  await testEndpoint('GET', '/events');
  await testEndpoint('GET', '/events/1');
  console.log('');

  // 3. Authentication
  console.log('📋 3. Authentication');
  
  // Register a test user
  const registerResult = await testEndpoint('POST', '/auth/register', {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  });

  // Login
  const loginResult = await testEndpoint('POST', '/auth/login', {
    email: 'test@example.com',
    password: 'password123'
  });

  if (loginResult.success && loginResult.data.token) {
    authToken = loginResult.data.token;
    console.log('✅ Authentication successful, token obtained');
  }
  console.log('');

  // 4. Protected Routes (with auth)
  if (authToken) {
    console.log('📋 4. Protected Routes (with authentication)');
    await testEndpoint('GET', '/auth/profile', null, authToken);
    await testEndpoint('GET', '/orders', null, authToken);
    await testEndpoint('GET', '/tickets', null, authToken);
    console.log('');

    // 5. Seat Maps
    console.log('📋 5. Seat Maps');
    await testEndpoint('GET', '/seatmaps/event/1', null, authToken);
    console.log('');

    // 6. Booking Flow
    console.log('📋 6. Booking Flow');
    
    // Reserve seats
    const reserveResult = await testEndpoint('POST', '/bookings/reserve', {
      eventId: 1,
      seatIds: [1, 2],
      userId: 1
    }, authToken);

    if (reserveResult.success) {
      console.log('✅ Seat reservation successful');
      
      // Confirm reservation
      await testEndpoint('POST', '/bookings/confirm', {
        reservationIds: [1]
      }, authToken);
    }
    console.log('');

    // 7. Create Order
    console.log('📋 7. Orders');
    await testEndpoint('POST', '/orders', {
      eventId: 1,
      seatIds: [3, 4],
      userId: 1
    }, authToken);
    console.log('');

  } else {
    console.log('❌ Authentication failed, skipping protected routes');
  }

  // 8. Admin Routes (test with admin credentials)
  console.log('📋 8. Admin Routes');
  
  // Login as admin
  const adminLoginResult = await testEndpoint('POST', '/auth/login', {
    username: 'admin',
    password: 'password123'
  });

  if (adminLoginResult.success && adminLoginResult.data.token) {
    const adminToken = adminLoginResult.data.token;
    await testEndpoint('GET', '/admin/events', null, adminToken);
    await testEndpoint('GET', '/admin/users', null, adminToken);
    await testEndpoint('GET', '/admin/orders', null, adminToken);
    await testEndpoint('GET', '/admin/stats', null, adminToken);
  } else {
    console.log('❌ Admin authentication failed');
  }
  console.log('');

  // 9. Error Cases
  console.log('📋 9. Error Cases');
  await testEndpoint('GET', '/events/999'); // Non-existent event
  await testEndpoint('POST', '/auth/login', { username: 'nonexistent', password: 'wrong' }); // Wrong credentials
  await testEndpoint('GET', '/orders'); // No auth token
  console.log('');

  console.log('🎉 API Endpoint Tests Completed!');
};

// Run the tests
runTests().catch(console.error); 