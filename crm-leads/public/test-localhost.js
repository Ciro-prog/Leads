/**
 * Script de Verificación para Localhost
 * Ejecutar en consola del navegador para verificar funcionamiento
 */

console.log('🧪 Iniciando pruebas del sistema...');

// Test 1: Verificar elementos DOM críticos
const testDOMElements = () => {
  console.log('\n1. 🔍 Verificando elementos DOM...');
  
  const elements = [
    { id: 'loginContainer', name: 'Login Container' },
    { id: 'dashboardContainer', name: 'Dashboard Container' },
    { id: 'navMenu', name: 'Navigation Menu' },
    { id: 'userName', name: 'User Name' }
  ];
  
  elements.forEach(elem => {
    const element = document.getElementById(elem.id);
    if (element) {
      console.log(`  ✅ ${elem.name} encontrado`);
    } else {
      console.log(`  ❌ ${elem.name} NO encontrado`);
    }
  });
};

// Test 2: Verificar objetos globales
const testGlobalObjects = () => {
  console.log('\n2. 🌐 Verificando objetos globales...');
  
  const globals = [
    { name: 'authManager', obj: window.authManager },
    { name: 'apiManager', obj: window.apiManager },
    { name: 'stateManager', obj: window.stateManager },
    { name: 'performanceMonitor', obj: window.performanceMonitor },
    { name: 'app', obj: window.app },
    { name: 'crmApp', obj: window.crmApp }
  ];
  
  globals.forEach(global => {
    if (global.obj) {
      console.log(`  ✅ ${global.name} disponible`);
    } else {
      console.log(`  ❌ ${global.name} NO disponible`);
    }
  });
};

// Test 3: Verificar navegación
const testNavigation = () => {
  console.log('\n3. 🧭 Verificando navegación...');
  
  if (window.app && typeof window.app.loadDashboardContent === 'function') {
    console.log('  ✅ Método loadDashboardContent disponible');
  } else {
    console.log('  ❌ Método loadDashboardContent NO disponible');
  }
  
  if (window.app && typeof window.app.loadLeadsManagement === 'function') {
    console.log('  ✅ Método loadLeadsManagement disponible');
  } else {
    console.log('  ❌ Método loadLeadsManagement NO disponible');
  }
};

// Test 4: Verificar estado de autenticación
const testAuthentication = () => {
  console.log('\n4. 🔐 Verificando autenticación...');
  
  if (window.authManager) {
    const isAuth = window.authManager.isAuthenticated();
    const user = window.authManager.getCurrentUser();
    
    console.log(`  📊 Autenticado: ${isAuth}`);
    console.log(`  👤 Usuario actual:`, user);
    
    if (isAuth && user) {
      console.log(`  ✅ Usuario autenticado como ${user.name} (${user.role})`);
    } else {
      console.log(`  ℹ️  No hay usuario autenticado`);
    }
  } else {
    console.log('  ❌ AuthManager no disponible');
  }
};

// Test 5: Verificar API endpoints
const testAPIEndpoints = async () => {
  console.log('\n5. 🌐 Verificando endpoints API...');
  
  if (!window.authManager || !window.authManager.isAuthenticated()) {
    console.log('  ⚠️  No autenticado - saltando pruebas de API');
    return;
  }
  
  const endpoints = [
    '/api/leads/stats',
    '/api/users/stats/dashboard'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const apiManager = window.apiManager || window.enhancedApiClient;
      if (apiManager) {
        console.log(`  🔄 Probando ${endpoint}...`);
        const response = await apiManager.get(endpoint);
        console.log(`  ✅ ${endpoint}: OK`);
      } else {
        console.log(`  ❌ No hay cliente API disponible`);
      }
    } catch (error) {
      console.log(`  ❌ ${endpoint}: Error - ${error.message}`);
    }
  }
};

// Test 6: Simular navegación
const testNavigationFlow = () => {
  console.log('\n6. 🔄 Probando flujo de navegación...');
  
  if (!window.app) {
    console.log('  ❌ App no disponible');
    return;
  }
  
  const user = window.authManager?.getCurrentUser();
  if (!user) {
    console.log('  ⚠️  No hay usuario - no se puede probar navegación');
    return;
  }
  
  try {
    console.log('  🎯 Probando carga de dashboard...');
    window.app.loadDashboardContent(user);
    console.log('  ✅ Dashboard cargado');
    
    setTimeout(() => {
      console.log('  🎯 Probando navegación a leads...');
      window.app.loadLeadsManagement();
      console.log('  ✅ Leads navigation working');
      
      setTimeout(() => {
        console.log('  🔙 Volviendo al dashboard...');
        window.app.loadDashboardContent(user);
        console.log('  ✅ Back to dashboard working');
      }, 1000);
    }, 1000);
    
  } catch (error) {
    console.log('  ❌ Error en navegación:', error);
  }
};

// Ejecutar todas las pruebas
const runAllTests = async () => {
  testDOMElements();
  testGlobalObjects();
  testNavigation();
  testAuthentication();
  await testAPIEndpoints();
  testNavigationFlow();
  
  console.log('\n🎉 Pruebas completadas. Revisa los resultados arriba.');
  console.log('\n💡 Para probar manualmente:');
  console.log('1. Inicia sesión si no lo has hecho');
  console.log('2. Verifica que aparezcan tabs de navegación');
  console.log('3. Haz clic en cada tab para probar la navegación');
  console.log('4. Verifica que aparezcan números reales en el dashboard');
};

// Auto-ejecutar cuando se carga el script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(runAllTests, 2000); // Wait 2 seconds for everything to load
  });
} else {
  setTimeout(runAllTests, 1000); // If already loaded, wait 1 second
}

// Make available globally
window.testLocalhost = runAllTests;