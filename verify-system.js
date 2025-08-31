/**
 * Simple System Verification Script
 * Checks if all API endpoints are working correctly
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api';

const ENDPOINTS_TO_TEST = [
    '/health',
    '/auth/login',
    '/leads',
    '/leads/stats', 
    '/users',
    '/users/sellers',
    '/users/stats/dashboard',
    '/import/history'
];

function testEndpoint(endpoint) {
    return new Promise((resolve) => {
        const url = `${API_BASE}${endpoint}`;
        console.log(`🔍 Testing: ${url}`);
        
        const req = http.get(url, (res) => {
            console.log(`✅ ${endpoint} - Status: ${res.statusCode}`);
            resolve({ endpoint, status: res.statusCode, success: true });
        });
        
        req.on('error', (error) => {
            console.log(`❌ ${endpoint} - Error: ${error.message}`);
            resolve({ endpoint, status: 'ERROR', success: false, error: error.message });
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
            console.log(`⏰ ${endpoint} - Timeout`);
            resolve({ endpoint, status: 'TIMEOUT', success: false });
        });
    });
}

async function verifySystem() {
    console.log('🚀 Starting CRM System Verification...\n');
    
    // Test server availability
    console.log('📡 Testing server availability...');
    try {
        const healthCheck = await testEndpoint('/health');
        if (!healthCheck.success) {
            console.log('❌ Server is not running or not accessible');
            console.log('💡 Please make sure to start the server with: npm start');
            return;
        }
        console.log('✅ Server is running and accessible\n');
    } catch (error) {
        console.log('❌ Server connection failed:', error.message);
        return;
    }
    
    // Test all endpoints
    console.log('🔗 Testing API endpoints...');
    const results = await Promise.all(
        ENDPOINTS_TO_TEST.map(endpoint => testEndpoint(endpoint))
    );
    
    console.log('\n📊 Results Summary:');
    console.log('═'.repeat(50));
    
    let successCount = 0;
    let errorCount = 0;
    
    results.forEach(result => {
        const status = result.status === 200 ? '✅' : 
                      result.status === 404 ? '🔍' : 
                      result.status === 401 ? '🔐' : '❌';
        
        console.log(`${status} ${result.endpoint.padEnd(25)} ${result.status}`);
        
        if (result.success && (result.status === 200 || result.status === 401)) {
            successCount++;
        } else {
            errorCount++;
        }
    });
    
    console.log('═'.repeat(50));
    console.log(`✅ Working endpoints: ${successCount}`);
    console.log(`❌ Problem endpoints: ${errorCount}`);
    
    if (errorCount === 0) {
        console.log('\n🎉 All endpoints are working correctly!');
        console.log('✅ The CRM system should be fully functional');
        console.log('🌐 Open http://localhost:3000 in your browser');
    } else {
        console.log('\n⚠️  Some endpoints have issues');
        console.log('🔧 Please check the server logs for more details');
    }
    
    console.log('\n💡 Notes:');
    console.log('- 🔐 401 status on auth endpoints is normal (requires authentication)');
    console.log('- 🔍 404 status indicates missing routes');
    console.log('- ✅ 200 status indicates working endpoints');
}

// Run verification
verifySystem().catch(console.error);