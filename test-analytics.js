#!/usr/bin/env node
/**
 * Test script for Analytics API
 * Verifies that the analytics endpoints are working correctly
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';

// Helper function to make HTTP requests
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    console.log(`\n📍 Testing: ${url}`);

    http.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ Status: ${res.statusCode}`);
          console.log(`📊 Response:`, JSON.stringify(json, null, 2));
          resolve({ status: res.statusCode, data: json });
        } catch (err) {
          console.log(`⚠️  Non-JSON response:`, data);
          resolve({ status: res.statusCode, data });
        }
      });
    }).on('error', (err) => {
      console.error(`❌ Error:`, err.message);
      reject(err);
    });
  });
}

// Run tests
async function runTests() {
  console.log('🧪 Testing Analytics API Endpoints\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Overview
    console.log('\n📋 Test 1: Analytics Overview');
    await makeRequest('/api/analytics/overview');

    // Test 2: Trends (7 days)
    console.log('\n📈 Test 2: Usage Trends (7 days)');
    await makeRequest('/api/analytics/trends?period=7d');

    // Test 3: Model Statistics
    console.log('\n🤖 Test 3: Model Statistics');
    await makeRequest('/api/analytics/models');

    // Test 4: Tools Statistics
    console.log('\n🔧 Test 4: Tools Statistics');
    await makeRequest('/api/analytics/tools');

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!');
    console.log('\n💡 Note: You need to be authenticated to see real data.');
    console.log('   The tests above show if the endpoints are accessible.');

  } catch (err) {
    console.error('\n❌ Tests failed:', err.message);
    process.exit(1);
  }
}

// Check if server is running
function checkServer() {
  return new Promise((resolve, reject) => {
    const req = http.get(`${BASE_URL}/`, (res) => {
      resolve(true);
    });

    req.on('error', (err) => {
      reject(new Error('Server is not running. Please start the server first with: npm run server'));
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Server connection timeout'));
    });
  });
}

// Main
(async () => {
  try {
    console.log('🔍 Checking if server is running...');
    await checkServer();
    console.log('✅ Server is running!\n');
    await runTests();
  } catch (err) {
    console.error(`\n❌ ${err.message}\n`);
    process.exit(1);
  }
})();
