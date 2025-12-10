/**
 * Automated Live Test Script using Playwright
 * Tests critical functionality on the live deployment
 */

const { chromium } = require('playwright');

const BASE_URL = 'https://nexo-jtsky100.web.app';
const LOGIN_EMAIL = 'antonio10jonathan@yahoo.com';
const LOGIN_PASSWORD = '12345678';

async function testLiveApp() {
  console.log('🚀 Starting Automated Live Test for Nexo Application...\n');
  console.log(`Testing URL: ${BASE_URL}\n`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  try {
    // Test 1: Navigate to homepage
    console.log('Test 1: Navigating to homepage...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const title = await page.title();
    const url = page.url();
    results.push({
      test: 'Homepage Load',
      passed: url.includes(BASE_URL) || url.includes('login'),
      details: `Title: ${title}, URL: ${url}`
    });
    console.log(`  ✅ Homepage loaded: ${url}`);

    // Test 2: Login
    console.log('\nTest 2: Attempting login...');
    try {
      // Wait for login form
      await page.waitForSelector('input[type="email"], input[name="email"], input[placeholder*="email" i]', { timeout: 10000 });
      
      // Fill login form
      const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
      if (emailInput) {
        await emailInput.fill(LOGIN_EMAIL);
      }
      
      await page.waitForTimeout(500);
      
      const passwordInput = await page.$('input[type="password"], input[name="password"]');
      if (passwordInput) {
        await passwordInput.fill(LOGIN_PASSWORD);
      }
      
      await page.waitForTimeout(500);
      
      // Click login button
      const loginButton = await page.$('button[type="submit"], button:has-text("Login"), button:has-text("Anmelden")');
      if (loginButton) {
        await loginButton.click();
      }
      
      await page.waitForTimeout(3000);
      
      // Check if login was successful (should redirect away from login page)
      const currentUrl = page.url();
      const loginSuccess = !currentUrl.includes('/login') || currentUrl.includes('/dashboard');
      
      results.push({
        test: 'Login',
        passed: loginSuccess,
        details: `After login URL: ${currentUrl}`
      });
      console.log(`  ${loginSuccess ? '✅' : '❌'} Login ${loginSuccess ? 'successful' : 'failed'}: ${currentUrl}`);
    } catch (error) {
      results.push({
        test: 'Login',
        passed: false,
        details: `Error: ${error.message}`
      });
      console.log(`  ❌ Login error: ${error.message}`);
    }

    // Test 3: Navigate to Dashboard
    console.log('\nTest 3: Testing Dashboard...');
    try {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const dashboardContent = await page.textContent('body');
      const hasDashboard = dashboardContent.includes('Dashboard') || 
                          dashboardContent.includes('Termine') || 
                          dashboardContent.includes('Finanz') ||
                          dashboardContent.includes('Übersicht');
      
      results.push({
        test: 'Dashboard Page',
        passed: hasDashboard,
        details: `Dashboard content found: ${hasDashboard}`
      });
      console.log(`  ${hasDashboard ? '✅' : '❌'} Dashboard ${hasDashboard ? 'loaded' : 'failed'}`);
    } catch (error) {
      results.push({
        test: 'Dashboard Page',
        passed: false,
        details: `Error: ${error.message}`
      });
      console.log(`  ❌ Dashboard error: ${error.message}`);
    }

    // Test 4: Navigate to Finance
    console.log('\nTest 4: Testing Finance page...');
    try {
      await page.goto(`${BASE_URL}/finance`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const financeContent = await page.textContent('body');
      const hasFinance = financeContent.includes('Finance') || 
                        financeContent.includes('Finanzen') || 
                        financeContent.includes('Einnahmen') ||
                        financeContent.includes('Ausgaben');
      
      results.push({
        test: 'Finance Page',
        passed: hasFinance,
        details: `Finance content found: ${hasFinance}`
      });
      console.log(`  ${hasFinance ? '✅' : '❌'} Finance ${hasFinance ? 'loaded' : 'failed'}`);
    } catch (error) {
      results.push({
        test: 'Finance Page',
        passed: false,
        details: `Error: ${error.message}`
      });
      console.log(`  ❌ Finance error: ${error.message}`);
    }

    // Test 5: Navigate to People
    console.log('\nTest 5: Testing People page...');
    try {
      await page.goto(`${BASE_URL}/people`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const peopleContent = await page.textContent('body');
      const hasPeople = peopleContent.includes('People') || 
                       peopleContent.includes('Personen') || 
                       peopleContent.includes('Haushalt');
      
      results.push({
        test: 'People Page',
        passed: hasPeople,
        details: `People content found: ${hasPeople}`
      });
      console.log(`  ${hasPeople ? '✅' : '❌'} People ${hasPeople ? 'loaded' : 'failed'}`);
    } catch (error) {
      results.push({
        test: 'People Page',
        passed: false,
        details: `Error: ${error.message}`
      });
      console.log(`  ❌ People error: ${error.message}`);
    }

    // Test 6: Navigate to Bills
    console.log('\nTest 6: Testing Bills page...');
    try {
      await page.goto(`${BASE_URL}/bills`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const billsContent = await page.textContent('body');
      const hasBills = billsContent.includes('Bills') || 
                     billsContent.includes('Rechnungen') || 
                     billsContent.includes('Zahlungen');
      
      results.push({
        test: 'Bills Page',
        passed: hasBills,
        details: `Bills content found: ${hasBills}`
      });
      console.log(`  ${hasBills ? '✅' : '❌'} Bills ${hasBills ? 'loaded' : 'failed'}`);
    } catch (error) {
      results.push({
        test: 'Bills Page',
        passed: false,
        details: `Error: ${error.message}`
      });
      console.log(`  ❌ Bills error: ${error.message}`);
    }

    // Test 7: Navigate to Calendar
    console.log('\nTest 7: Testing Calendar page...');
    try {
      await page.goto(`${BASE_URL}/calendar`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const calendarContent = await page.textContent('body');
      const hasCalendar = calendarContent.includes('Calendar') || 
                         calendarContent.includes('Kalender') || 
                         calendarContent.includes('Termin');
      
      results.push({
        test: 'Calendar Page',
        passed: hasCalendar,
        details: `Calendar content found: ${hasCalendar}`
      });
      console.log(`  ${hasCalendar ? '✅' : '❌'} Calendar ${hasCalendar ? 'loaded' : 'failed'}`);
    } catch (error) {
      results.push({
        test: 'Calendar Page',
        passed: false,
        details: `Error: ${error.message}`
      });
      console.log(`  ❌ Calendar error: ${error.message}`);
    }

    // Test 8: Navigate to Shopping
    console.log('\nTest 8: Testing Shopping page...');
    try {
      await page.goto(`${BASE_URL}/shopping`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const shoppingContent = await page.textContent('body');
      const hasShopping = shoppingContent.includes('Shopping') || 
                         shoppingContent.includes('Einkauf') || 
                         shoppingContent.includes('Liste');
      
      results.push({
        test: 'Shopping Page',
        passed: hasShopping,
        details: `Shopping content found: ${hasShopping}`
      });
      console.log(`  ${hasShopping ? '✅' : '❌'} Shopping ${hasShopping ? 'loaded' : 'failed'}`);
    } catch (error) {
      results.push({
        test: 'Shopping Page',
        passed: false,
        details: `Error: ${error.message}`
      });
      console.log(`  ❌ Shopping error: ${error.message}`);
    }

    // Test 9: Check for console errors
    console.log('\nTest 9: Checking for console errors...');
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);
    
    results.push({
      test: 'Console Errors',
      passed: consoleErrors.length === 0,
      details: consoleErrors.length > 0 ? `Found ${consoleErrors.length} errors` : 'No console errors'
    });
    console.log(`  ${consoleErrors.length === 0 ? '✅' : '❌'} Console errors: ${consoleErrors.length}`);

  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    // Keep browser open for 5 seconds to see results
    await page.waitForTimeout(5000);
    await browser.close();
  }

  // Print summary
  console.log('\n📊 Test Results Summary:');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.test}`);
    console.log(`   ${result.details}`);
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

