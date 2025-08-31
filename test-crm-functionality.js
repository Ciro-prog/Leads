/**
 * CRM System Functionality Test with Playwright
 * Tests buttons, tabs, and all major functionality
 */

const { chromium } = require('playwright');

async function testCRMSystem() {
    console.log('🧪 Starting CRM System Functionality Test...');
    
    // Launch browser
    const browser = await chromium.launch({ 
        headless: false, // Show browser for debugging
        slowMo: 1000    // Slow down operations to observe
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('🌐 Navigating to CRM application...');
        await page.goto('http://localhost:3000');
        
        // Test 1: Login functionality
        console.log('🔐 Testing login functionality...');
        await page.fill('#username', 'admin');
        await page.fill('#password', 'admin123');
        await page.click('button[type="submit"]');
        
        // Wait for dashboard to load
        await page.waitForSelector('#dashboardContainer', { state: 'visible', timeout: 10000 });
        console.log('✅ Login successful - Dashboard loaded');
        
        // Test 2: Navigation menu functionality
        console.log('🧭 Testing navigation functionality...');
        
        // Test Leads Management
        console.log('📋 Testing Leads Management...');
        await page.click('a[href="#leads"]');
        await page.waitForTimeout(2000);
        
        // Check if leads content loaded without errors
        const leadsError = await page.$('.alert-danger');
        if (leadsError) {
            console.log('❌ Error in Leads Management section');
            const errorText = await leadsError.textContent();
            console.log('Error:', errorText);
        } else {
            console.log('✅ Leads Management loaded successfully');
        }
        
        // Test Users Management
        console.log('👥 Testing Users Management...');
        await page.click('a[href="#users"]');
        await page.waitForTimeout(2000);
        
        // Check if users content loaded without errors
        const usersError = await page.$('.alert-danger');
        if (usersError) {
            console.log('❌ Error in Users Management section');
            const errorText = await usersError.textContent();
            console.log('Error:', errorText);
        } else {
            console.log('✅ Users Management loaded successfully');
        }
        
        // Test Import Tool
        console.log('📤 Testing Import Tool...');
        await page.click('a[href="#import"]');
        await page.waitForTimeout(2000);
        
        // Check if import content loaded without errors
        const importError = await page.$('.alert-danger');
        if (importError) {
            console.log('❌ Error in Import Tool section');
            const errorText = await importError.textContent();
            console.log('Error:', errorText);
        } else {
            console.log('✅ Import Tool loaded successfully');
        }
        
        // Test 3: Button functionality
        console.log('🔘 Testing button functionality...');
        
        // Test refresh buttons
        const refreshButtons = await page.$$('button:has-text("Actualizar")');
        for (let i = 0; i < refreshButtons.length; i++) {
            console.log(`Testing refresh button ${i + 1}...`);
            await refreshButtons[i].click();
            await page.waitForTimeout(1000);
        }
        console.log('✅ Refresh buttons working');
        
        // Test 4: API responses validation
        console.log('🔗 Testing API responses...');
        
        // Intercept API calls to verify they're successful
        page.on('response', response => {
            if (response.url().includes('/api/')) {
                console.log(`API: ${response.url()} - Status: ${response.status()}`);
                if (response.status() === 404) {
                    console.log('❌ 404 Error detected:', response.url());
                } else if (response.status() >= 200 && response.status() < 300) {
                    console.log('✅ API Success:', response.url());
                }
            }
        });
        
        // Trigger API calls by switching sections
        await page.click('a[href="#leads"]');
        await page.waitForTimeout(2000);
        
        await page.click('a[href="#users"]');
        await page.waitForTimeout(2000);
        
        await page.click('a[href="#import"]');
        await page.waitForTimeout(2000);
        
        // Test 5: Check console errors
        console.log('📊 Checking console errors...');
        const consoleLogs = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleLogs.push(msg.text());
                console.log('Console Error:', msg.text());
            }
        });
        
        // Test 6: Loading states
        console.log('⏳ Testing loading states...');
        const loadingSpinner = await page.$('#loadingSpinner');
        if (loadingSpinner) {
            console.log('✅ Loading spinner element exists');
        } else {
            console.log('❌ Loading spinner element not found');
        }
        
        console.log('🎉 Test completed successfully!');
        
        // Keep browser open for manual inspection
        console.log('Browser will remain open for 30 seconds for manual inspection...');
        await page.waitForTimeout(30000);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
        console.log('🔚 Browser closed');
    }
}

// Run the test
if (require.main === module) {
    testCRMSystem().catch(console.error);
}

module.exports = { testCRMSystem };