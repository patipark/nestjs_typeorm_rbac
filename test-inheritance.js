const axios = require('axios');

// Base URL for API
const baseUrl = 'http://localhost:3000';

// User credentials for each role
const users = {
  user: { username: 'user', password: 'user123' },
  editor: { username: 'editor', password: 'editor123' },
  manager: { username: 'manager', password: 'manager123' },
  admin: { username: 'admin', password: 'admin123' }
};

// Test endpoints with different required roles
const endpoints = [
  { url: '/test-access/public', description: 'Public access (authenticated)', role: 'authenticated' },
  { url: '/test-access/user', description: 'User access', role: 'user' },
  { url: '/test-access/editor', description: 'Editor access', role: 'editor' },
  { url: '/test-access/manager', description: 'Manager access', role: 'manager' },
  { url: '/test-access/admin', description: 'Admin access', role: 'admin' },
  { url: '/roles', description: 'Get all roles', role: 'admin' },
  { url: '/users', description: 'Get all users', role: 'admin' }
];

// Helper function to add delay between requests
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Function to get token for a user
async function login(username, password) {
  try {
    console.log(`Attempting to login as ${username}...`);
    const response = await axios.post(`${baseUrl}/auth/login`, { username, password });
    console.log(`Login successful for ${username}`);
    return response.data.access_token;
  } catch (error) {
    console.error(`Login failed for ${username}:`, error.response?.data?.message || error.message);
    return null;
  }
}

// Function to test an endpoint with a token
async function testEndpoint(url, token, description, username) {
  try {
    const response = await axios.get(`${baseUrl}${url}`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000 // 5 second timeout
    });
    console.log(`✅ [${username}] Access to ${url} (${description}) succeeded`);
    return true;
  } catch (error) {
    console.log(`❌ [${username}] Access to ${url} (${description}) failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🔒 Testing Role Inheritance in NestJS TypeORM RBAC 🔒\n');

  // Get tokens for all users
  const tokens = {};
  for (const [role, credentials] of Object.entries(users)) {
    tokens[role] = await login(credentials.username, credentials.password);
    if (!tokens[role]) {
      console.error(`Could not get token for ${role}, skipping this user`);
    }
    // Add a short delay between logins
    await delay(1000);
  }

  console.log('\n📝 Testing endpoints with each user role...\n');

  // Test matrix for each endpoint with each user
  const results = {};
  
  for (const [role, token] of Object.entries(tokens)) {
    if (!token) continue;
    
    results[role] = {};
    
    for (const endpoint of endpoints) {
      results[role][endpoint.url] = await testEndpoint(
        endpoint.url, 
        token, 
        endpoint.description,
        role
      );
      // Add a short delay between endpoint tests
      await delay(1000);
    }
  }
  // Summary
  console.log('\n📊 Test Results Summary:\n');
  
  // Set up the table with proper spacing
  console.log('Endpoint'.padEnd(25) + '| Required Role'.padEnd(15) + '| user'.padEnd(10) + '| editor'.padEnd(15) + '| manager'.padEnd(15) + '| admin');
  console.log('-'.repeat(80));
  
  for (const endpoint of endpoints) {
    const row = [
      endpoint.url.padEnd(24),
      endpoint.role.padEnd(14),
      (results.user?.[endpoint.url] ? '✅' : '❌').padEnd(9),
      (results.editor?.[endpoint.url] ? '✅' : '❌').padEnd(14),
      (results.manager?.[endpoint.url] ? '✅' : '❌').padEnd(14),
      (results.admin?.[endpoint.url] ? '✅' : '❌')
    ];
    console.log(row.join('| '));
  }

  console.log('\n🔍 Role Inheritance Check:\n');
  console.log('- user roles should only access user-level endpoints');
  console.log('- editor roles should access user and editor endpoints');
  console.log('- manager roles should access user, editor, and manager endpoints');
  console.log('- admin roles should access all endpoints\n');
}

// Start the application
console.log('Make sure your NestJS application is running on http://localhost:3000');
runTests()
  .catch(err => console.error('Test failed:', err));
