/**
 * Simple HTTP-based Live Test Script
 * Tests if pages are accessible
 */

import https from 'https';

import http from 'http';

const BASE_URL = 'nexo-jtsky100.web.app';
const LOGIN_EMAIL = 'antonio10jonathan@yahoo.com';
const LOGIN_PASSWORD = '12345678';

function makeRequest(url, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: url,
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testLiveApp() {
  console.log('🚀 Starting Automated Live Test for Nexo Application...\n');
  console.log(`Testing URL: https://${BASE_URL}\n`);

  const tests = [
    { name: 'Homepage', path: '/' },
    { name: 'Login Page', path: '/login' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Finance', path: '/finance' },
    { name: 'People', path: '/people' },
    { name: 'Bills', path: '/bills' },
    { name: 'Calendar', path: '/calendar' },
    { name: 'Shopping', path: '/shopping' },
    { name: 'Reminders', path: '/reminders' },
    { name: 'Taxes', path: '/taxes' }
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}...`);
      const response = await makeRequest(BASE_URL, test.path);
      
      const passed = response.statusCode === 200 || response.statusCode === 302 || response.statusCode === 401;
      const isRedirect = response.statusCode === 302 || response.statusCode === 401;
      
      results.push({
        name: test.name,
        path: test.path,
        statusCode: response.statusCode,
        passed: passed,
        isRedirect: isRedirect,
        message: isRedirect ? 'Requires authentication' : 'Accessible'
      });

      console.log(`  ${passed ? '✅' : '❌'} Status: ${response.statusCode} - ${isRedirect ? 'Requires auth' : 'OK'}`);
    } catch (error) {
      results.push({
        name: test.name,
        path: test.path,
        statusCode: 'ERROR',
        passed: false,
        message: error.message
      });
      console.log(`  ❌ Error: ${error.message}`);
    }
  }

  console.log('\n📊 Test Results Summary:');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
    console.log(`   Path: ${result.path}`);
    console.log(`   Status: ${result.statusCode}`);
    console.log(`   ${result.message}`);
    console.log('');
  });
  
  console.log('='.repeat(60));
  console.log(`Total: ${results.length} tests`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  
  return results;
}

// Run tests
testLiveApp()
  .then(results => {
    const allPassed = results.every(r => r.passed);
    process.exit(allPassed ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });

