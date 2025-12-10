/**
 * Live Test Script for Nexo Application
 * Tests critical functionality on the live deployment
 */

const BASE_URL = 'https://nexo-jtsky100.web.app';

async function testLiveApp() {
  console.log('🚀 Starting Live Test for Nexo Application...\n');
  console.log(`Testing URL: ${BASE_URL}\n`);

  const tests = [
    {
      name: '1. Homepage Loads',
      url: BASE_URL,
      check: (text) => text.includes('Nexo') || text.includes('Login') || text.includes('Dashboard')
    },
    {
      name: '2. Login Page',
      url: `${BASE_URL}/login`,
      check: (text) => text.includes('Login') || text.includes('Anmelden') || text.includes('email')
    },
    {
      name: '3. Dashboard Page',
      url: `${BASE_URL}/dashboard`,
      check: (text) => text.includes('Dashboard') || text.includes('Termine') || text.includes('Finanz')
    },
    {
      name: '4. Finance Page',
      url: `${BASE_URL}/finance`,
      check: (text) => text.includes('Finance') || text.includes('Finanzen') || text.includes('Einnahmen')
    },
    {
      name: '5. People Page',
      url: `${BASE_URL}/people`,
      check: (text) => text.includes('People') || text.includes('Personen') || text.includes('Haushalt')
    },
    {
      name: '6. Bills Page',
      url: `${BASE_URL}/bills`,
      check: (text) => text.includes('Bills') || text.includes('Rechnungen') || text.includes('Zahlungen')
    },
    {
      name: '7. Calendar Page',
      url: `${BASE_URL}/calendar`,
      check: (text) => text.includes('Calendar') || text.includes('Kalender') || text.includes('Termin')
    },
    {
      name: '8. Shopping Page',
      url: `${BASE_URL}/shopping`,
      check: (text) => text.includes('Shopping') || text.includes('Einkauf') || text.includes('Liste')
    },
    {
      name: '9. Reminders Page',
      url: `${BASE_URL}/reminders`,
      check: (text) => text.includes('Reminder') || text.includes('Erinnerung') || text.includes('Termin')
    },
    {
      name: '10. Taxes Page',
      url: `${BASE_URL}/taxes`,
      check: (text) => text.includes('Tax') || text.includes('Steuer') || text.includes('Profil')
    }
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}...`);
      
      // Use fetch to test if page loads
      const response = await fetch(test.url, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (response.ok) {
        const text = await response.text();
        const passed = test.check(text);
        
        results.push({
          name: test.name,
          url: test.url,
          status: response.status,
          passed: passed,
          message: passed ? '✅ PASS' : '⚠️ Page loads but content check failed'
        });
        
        console.log(`  ${passed ? '✅' : '⚠️'} Status: ${response.status} - ${passed ? 'PASS' : 'Content check failed'}`);
      } else {
        results.push({
          name: test.name,
          url: test.url,
          status: response.status,
          passed: false,
          message: `❌ FAIL - Status: ${response.status}`
        });
        console.log(`  ❌ Status: ${response.status} - FAIL`);
      }
    } catch (error) {
      results.push({
        name: test.name,
        url: test.url,
        status: 'ERROR',
        passed: false,
        message: `❌ ERROR - ${error.message}`
      });
      console.log(`  ❌ ERROR: ${error.message}`);
    }
  }

  console.log('\n📊 Test Results Summary:');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
    console.log(`   URL: ${result.url}`);
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

