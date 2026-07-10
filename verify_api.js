import app from './src/app.js';
import { prisma } from './src/config/database.js';

const PORT = 5001; // Separate port for testing
let server;

async function runTests() {
  console.log('--- Starting API Integration & Auth Tests ---');
  
  server = app.listen(PORT, async () => {
    console.log(`Test server running on port ${PORT}`);
    
    try {
      // 1. Health Check
      await testEndpoint('/health', 'Health Check');

      // 2. Auth: Register new Citizen
      const testUsername = `vikram_singh_${Date.now()}`;
      const testPhone = `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      console.log(`\n[Test] Testing Citizen Registration for user: ${testUsername}...`);
      const registerRes = await testPostEndpoint('/api/v1/auth/register', {
        name: 'Vikram Singh',
        username: testUsername,
        password: 'secure_password123',
        phone: testPhone
      }, 'Citizen Registration');

      // 3. Auth: Login Citizen
      console.log('\n[Test] Testing Citizen Login...');
      const loginRes = await testPostEndpoint('/api/v1/auth/login', {
        username: testUsername,
        password: 'secure_password123',
        type: 'USER'
      }, 'Citizen Login');

      // 4. Get Departments
      const deptsRes = await testEndpoint('/api/v1/departments', 'Get Departments');
      const departments = deptsRes.data;
      
      let sanitationId = '';
      if (departments && departments.length > 0) {
        const sanitation = departments.find(d => d.name.includes('Sanitation'));
        if (sanitation) sanitationId = sanitation.id;
      }

      // 5. Get Department by ID
      if (sanitationId) {
        await testEndpoint(`/api/v1/departments/${sanitationId}`, 'Get Department Details');
      }

      // 6. Get Officers
      await testEndpoint('/api/v1/officers', 'Get Officers');
      
      // 7. Get Complaints
      const complaintsRes = await testEndpoint('/api/v1/complaints', 'Get Complaints List');
      const complaints = complaintsRes.data.data;

      // 8. Get Complaint by ID
      if (complaints && complaints.length > 0) {
        const firstComplaintId = complaints[0].id;
        await testEndpoint(`/api/v1/complaints/${firstComplaintId}`, 'Get Complaint Details');
      }

      // 9. Search Endpoint
      await testEndpoint('/api/v1/search?q=Garbage', 'Unified Search (Query: "Garbage")');

      // 10. Analytics
      await testEndpoint('/api/v1/analytics/summary', 'Analytics Summary');
      await testEndpoint('/api/v1/analytics/departments', 'Analytics Departments Comparison');
      await testEndpoint('/api/v1/analytics/trends', 'Analytics Trends');

      // 11. Auth: Logout Citizen
      if (loginRes.data && loginRes.data.refreshToken) {
        console.log('\n[Test] Testing Citizen Logout...');
        await testPostEndpoint('/api/v1/auth/logout', {
          refreshToken: loginRes.data.refreshToken
        }, 'Citizen Logout');
      }

      console.log('\n--- All API & Auth Tests Completed Successfully! ---');
    } catch (err) {
      console.error('\n--- Test Execution Failed ---', err);
    } finally {
      closeServer();
    }
  });
}

async function testEndpoint(path, description) {
  const url = `http://localhost:${PORT}${path}`;
  console.log(`[Test] GET ${path}`);
  const response = await fetch(url);
  const json = await response.json();
  
  if (response.ok && json.success !== false) {
    console.log(`[PASS] ${description} returned status ${response.status}`);
    return json;
  } else {
    throw new Error(`[FAIL] ${description} returned status ${response.status}: ${JSON.stringify(json)}`);
  }
}

async function testPostEndpoint(path, body, description) {
  const url = `http://localhost:${PORT}${path}`;
  console.log(`[Test] POST ${path}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await response.json();
  
  if (response.ok && json.success !== false) {
    console.log(`[PASS] ${description} returned status ${response.status}`);
    return json;
  } else {
    throw new Error(`[FAIL] ${description} returned status ${response.status}: ${JSON.stringify(json)}`);
  }
}

function closeServer() {
  console.log('\nClosing test server and database connection...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Test session finished.');
    process.exit(0);
  });
}

runTests();
