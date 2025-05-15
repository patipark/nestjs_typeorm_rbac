const http = require('http');

// HTTP POST request options
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

// User login data
const data = JSON.stringify({
  username: 'admin',
  password: 'admin123'
});

// Make the request
const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:');
    try {
      console.log(JSON.parse(responseData));
    } catch (e) {
      console.log(responseData);
    }
  });
});

req.on('error', (error) => {
  console.error(`Error: ${error.message}`);
});

// Write data to request body
req.write(data);
req.end();

console.log('Request sent, waiting for response...');
