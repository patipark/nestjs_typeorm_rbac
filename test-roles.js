import axios from 'axios';
import * as readline from 'readline';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

// Function to get token for a user
async function login(username, password) {
  try {
    const response = await axios.post(`${baseUrl}/auth/login`, { username, password });
    return response.data.access_token;
  } catch (error) {
    console.error(`Login failed for ${username}:`, error.response?.data || error.message);
    return null;
  }
}

// Function to test an endpoint with a token
async function testEndpoint(url, token, description, username) {
  try {
    const response = await axios.get(`${baseUrl}${url}`, {
      headers: { Authorization: `Bearer ${token}` }
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
    console.log(`Logging in as ${role}...`);
    tokens[role] = await login(credentials.username, credentials.password);
    if (!tokens[role]) {
      console.error(`Could not get token for ${role}, skipping this user`);
    }
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
    }
  }

  // Summary
  console.log('\n📊 Test Results Summary:\n');
  console.log('Endpoint\t| Required role\t| user\t| editor\t| manager\t| admin');
  console.log('-'.repeat(80));
  
  for (const endpoint of endpoints) {
    const row = [
      endpoint.url,
      endpoint.role,
      results.user?.[endpoint.url] ? '✅' : '❌',
      results.editor?.[endpoint.url] ? '✅' : '❌',
      results.manager?.[endpoint.url] ? '✅' : '❌',
      results.admin?.[endpoint.url] ? '✅' : '❌'
    ];
    console.log(row.join('\t| '));
  }

  console.log('\n🔍 Role Inheritance Check:\n');
  console.log('- user roles should only access user-level endpoints');
  console.log('- editor roles should access user and editor endpoints');
  console.log('- manager roles should access user, editor, and manager endpoints');
  console.log('- admin roles should access all endpoints\n');

  rl.close();
}

// Start the application 
console.log('Make sure your NestJS application is running on http://localhost:3000');
rl.question('Press Enter to start the tests...', () => {
  runTests()
    .catch(err => console.error('Test failed:', err))
    .finally(() => rl.close());
});
