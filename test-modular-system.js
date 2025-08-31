/**
 * Test Script for Modular CRM System
 * Tests all API endpoints and navigation functionality
 */

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testUser: {
    username: 'testadmin',
    password: 'admin123'
  }
};

class ModularSystemTester {
  constructor() {
    this.token = null;
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runAllTests() {
    console.log('🧪 Starting Modular CRM System Tests...\n');

    try {
      // Authentication tests
      await this.testAuthentication();
      
      // API endpoint tests
      await this.testDashboardEndpoints();
      await this.testLeadsEndpoints();
      await this.testSellersEndpoints();
      await this.testImportEndpoints();

      // Module integration tests
      await this.testModuleIntegration();

      // Performance tests
      await this.testPerformance();

    } catch (error) {
      this.logError('Test suite execution failed:', error);
    }

    this.printResults();
  }

  async testAuthentication() {
    console.log('🔐 Testing Authentication...');
    
    try {
      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(TEST_CONFIG.testUser)
      });

      const data = await response.json();
      
      if (data.success && data.token) {
        this.token = data.token;
        this.logPass('Authentication successful');
      } else {
        this.logFail('Authentication failed', data.message);
      }
    } catch (error) {
      this.logFail('Authentication error', error.message);
    }
  }

  async testDashboardEndpoints() {
    console.log('\n📊 Testing Dashboard Endpoints...');

    const endpoints = [
      { path: '/api/leads/stats', name: 'Leads Stats' },
      { path: '/api/users/stats/dashboard', name: 'Users Dashboard Stats' }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint);
    }
  }

  async testLeadsEndpoints() {
    console.log('\n🎯 Testing Leads Endpoints...');

    const endpoints = [
      { path: '/api/leads', name: 'Get Leads' },
      { path: '/api/leads/provinces-with-unassigned', name: 'Get Provinces' }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint);
    }
  }

  async testSellersEndpoints() {
    console.log('\n👥 Testing Sellers Endpoints...');

    const endpoints = [
      { path: '/api/users/sellers', name: 'Get Sellers' },
      { path: '/api/users', name: 'Get All Users' }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint);
    }
  }

  async testImportEndpoints() {
    console.log('\n📤 Testing Import Endpoints...');

    const endpoints = [
      { path: '/api/import/history', name: 'Import History' }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint);
    }
  }

  async testEndpoint(endpoint) {
    try {
      const response = await fetch(`${TEST_CONFIG.baseUrl}${endpoint.path}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success !== false) {
          this.logPass(`${endpoint.name}: OK (${response.status})`);
        } else {
          this.logFail(`${endpoint.name}: API Error`, data.message);
        }
      } else {
        this.logFail(`${endpoint.name}: HTTP Error`, `Status: ${response.status}`);
      }
    } catch (error) {
      this.logFail(`${endpoint.name}: Network Error`, error.message);
    }
  }

  async testModuleIntegration() {
    console.log('\n🧩 Testing Module Integration...');

    // Test modular component structure
    const modules = ['StateManager', 'APIManager', 'ComponentRegistry', 'PerformanceMonitor'];
    
    modules.forEach(module => {
      // This would be run in browser context
      this.logInfo(`Module ${module}: Should be available globally`);
    });
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...');

    try {
      const start = Date.now();
      
      // Batch request test
      const batchRequests = [
        `/api/leads/stats`,
        `/api/users/stats/dashboard`
      ];

      const responses = await Promise.allSettled(
        batchRequests.map(path =>
          fetch(`${TEST_CONFIG.baseUrl}${path}`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
          })
        )
      );

      const duration = Date.now() - start;
      
      const successful = responses.filter(r => r.status === 'fulfilled').length;
      
      if (successful === batchRequests.length) {
        this.logPass(`Batch requests: ${successful}/${batchRequests.length} successful in ${duration}ms`);
      } else {
        this.logFail(`Batch requests: Only ${successful}/${batchRequests.length} successful`);
      }

    } catch (error) {
      this.logFail('Performance test failed', error.message);
    }
  }

  logPass(message) {
    console.log(`  ✅ ${message}`);
    this.results.passed++;
    this.results.tests.push({ status: 'PASS', message });
  }

  logFail(message, details = '') {
    console.log(`  ❌ ${message}${details ? ': ' + details : ''}`);
    this.results.failed++;
    this.results.tests.push({ status: 'FAIL', message, details });
  }

  logInfo(message) {
    console.log(`  ℹ️  ${message}`);
  }

  logError(message, error) {
    console.error(`  🚨 ${message}`, error);
  }

  printResults() {
    console.log('\n📋 Test Results Summary:');
    console.log('========================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Total: ${this.results.passed + this.results.failed}`);
    
    if (this.results.failed > 0) {
      console.log('\n🔍 Failed Tests:');
      this.results.tests
        .filter(t => t.status === 'FAIL')
        .forEach(test => {
          console.log(`  - ${test.message}${test.details ? ': ' + test.details : ''}`);
        });
    }

    console.log(`\n🎯 Success Rate: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`);
  }
}

// Frontend Integration Test (to be run in browser console)
const FRONTEND_TEST_SCRIPT = `
// Test Modular Components in Browser
console.log('🌐 Testing Frontend Modular Components...');

// Test global objects
const requiredGlobals = ['stateManager', 'apiManager', 'componentRegistry', 'performanceMonitor'];
const missingGlobals = requiredGlobals.filter(obj => !window[obj]);

if (missingGlobals.length === 0) {
  console.log('✅ All required global objects are available');
} else {
  console.error('❌ Missing global objects:', missingGlobals);
}

// Test navigation module
if (window.navigationModule) {
  console.log('✅ NavigationModule is available');
  
  // Test tab switching
  const testTabs = ['dashboard', 'leads', 'sellers', 'import', 'settings'];
  
  console.log('🧪 Testing tab navigation...');
  testTabs.forEach(async (tab, index) => {
    setTimeout(async () => {
      try {
        await window.navigationModule.switchToTab(tab);
        console.log(\`✅ Successfully switched to \${tab} tab\`);
      } catch (error) {
        console.error(\`❌ Failed to switch to \${tab} tab:\`, error);
      }
    }, index * 2000); // 2 second delay between each test
  });
} else {
  console.error('❌ NavigationModule not available');
}

// Test state manager
if (window.stateManager) {
  console.log('✅ StateManager working');
  console.log('📊 State Manager Metrics:', window.stateManager.getMetrics());
} else {
  console.error('❌ StateManager not available');
}

// Test performance monitor
if (window.performanceMonitor) {
  console.log('✅ PerformanceMonitor working');
  console.log('📈 Performance Metrics:', window.showPerformanceMetrics());
} else {
  console.error('❌ PerformanceMonitor not available');
}
`;

// Run the test if executed directly
if (require.main === module) {
  const tester = new ModularSystemTester();
  tester.runAllTests();
}

// Export for use in other contexts
module.exports = { ModularSystemTester, FRONTEND_TEST_SCRIPT };

console.log(`
🧪 Modular CRM System Test Suite
================================

Backend Tests (Node.js):
  node test-modular-system.js

Frontend Tests (Browser Console):
  Copy and paste the FRONTEND_TEST_SCRIPT into your browser console

Manual Navigation Test:
  1. Login to the system
  2. Try switching between all tabs: Dashboard, Leads, Sellers, Import, Settings
  3. Check browser console for any errors
  4. Verify all data loads correctly

Expected Results:
  ✅ All API endpoints return data
  ✅ Navigation between tabs works smoothly
  ✅ Leads module displays and functions correctly
  ✅ Sellers tab shows user data
  ✅ No JavaScript errors in console
  ✅ Performance metrics show good response times
`);