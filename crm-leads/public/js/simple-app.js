// Simple Direct App - No complex initialization
console.log('🚀 Simple CRM App loading...');

// Global variables
let currentUser = null;
let authToken = localStorage.getItem('token');

// DOM Elements
let loadingSpinner, loginContainer, dashboardContainer, userName, navMenu, userDropdown;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 DOM Ready - Initializing Simple CRM...');
    
    // Get DOM elements
    loadingSpinner = document.getElementById('loadingSpinner');
    loginContainer = document.getElementById('loginContainer');
    dashboardContainer = document.getElementById('dashboardContainer');
    userName = document.getElementById('userName');
    navMenu = document.getElementById('navMenu');
    userDropdown = document.getElementById('userDropdown');
    
    // Hide loading immediately
    hideSpinner();
    
    // Show login form
    showLoginForm();
    
    // Setup login form handler
    setupLoginHandler();
    
    console.log('✅ Simple CRM initialized successfully');
});

function hideSpinner() {
    console.log('🔄 Hiding spinner...');
    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
        console.log('✅ Spinner hidden');
    }
}

function showLoginForm() {
    console.log('👤 Showing login form...');
    
    if (loginContainer) {
        loginContainer.style.display = 'block';
    }
    if (dashboardContainer) {
        dashboardContainer.style.display = 'none';
    }
    if (userDropdown) {
        userDropdown.style.display = 'none';
    }
    
    console.log('✅ Login form visible');
}

function showDashboard(user) {
    console.log('📊 Showing dashboard for:', user.name);
    
    if (loginContainer) {
        loginContainer.style.display = 'none';
    }
    if (dashboardContainer) {
        dashboardContainer.style.display = 'block';
    }
    if (userDropdown) {
        userDropdown.style.display = 'block';
    }
    if (userName) {
        userName.textContent = user.name;
    }
    
    // Setup navigation
    setupNavigation(user);
    
    // Load dashboard content
    loadDashboardContent(user);
    
    console.log('✅ Dashboard loaded');
}

function setupLoginHandler() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        console.log('🔐 Attempting login for:', username);
        
        // Show loading during login
        showSpinner();
        hideLoginError();
        
        try {
            // Make API call
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Login successful');
                
                // Store user data
                currentUser = data.data.user;
                authToken = data.data.token;
                localStorage.setItem('token', authToken);
                
                // Show dashboard
                hideSpinner();
                showDashboard(currentUser);
                
            } else {
                console.log('❌ Login failed:', data.message);
                hideSpinner();
                showLoginError(data.message || 'Credenciales inválidas');
            }
            
        } catch (error) {
            console.error('❌ Login error:', error);
            hideSpinner();
            showLoginError('Error de conexión al servidor');
        }
    });
}

function setupNavigation(user) {
    if (!navMenu) return;
    
    let menuHTML = '';
    
    if (user.role === 'admin') {
        menuHTML = `
            <li class="nav-item">
                <a class="nav-link active" href="#" onclick="loadDashboard()">
                    <i class="bi bi-speedometer2 me-1"></i>Dashboard
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="alert('Función en desarrollo')">
                    <i class="bi bi-person-lines-fill me-1"></i>Leads
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" onclick="alert('Función en desarrollo')">
                    <i class="bi bi-people me-1"></i>Vendedores
                </a>
            </li>
        `;
    } else {
        menuHTML = `
            <li class="nav-item">
                <a class="nav-link active" href="#" onclick="loadDashboard()">
                    <i class="bi bi-person-lines-fill me-1"></i>Mis Leads
                </a>
            </li>
        `;
    }
    
    navMenu.innerHTML = menuHTML;
    
    // Setup logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

function loadDashboardContent(user) {
    if (!dashboardContainer) return;
    
    let dashboardHTML = '';
    
    if (user.role === 'admin') {
        dashboardHTML = `
            <div class="row">
                <div class="col-12">
                    <h2><i class="bi bi-speedometer2 me-2"></i>Dashboard Administrativo</h2>
                    <p class="text-muted">Bienvenido ${user.name} - ${user.role}</p>
                </div>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card stat-card">
                        <div class="card-body text-center">
                            <h3>--</h3>
                            <p class="mb-0">Total Leads</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card stat-card-success">
                        <div class="card-body text-center">
                            <h3>--</h3>
                            <p class="mb-0">Vendedores Activos</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card stat-card-warning">
                        <div class="card-body text-center">
                            <h3>--</h3>
                            <p class="mb-0">Sin Asignar</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card stat-card-danger">
                        <div class="card-body text-center">
                            <h3>14</h3>
                            <p class="mb-0">Total Vendedores</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="bi bi-check2-circle me-2"></i>Sistema CRM Funcionando</h5>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-success">
                                <h6><i class="bi bi-check-circle me-2"></i>¡Login exitoso!</h6>
                                <p class="mb-0">El sistema de autenticación funciona correctamente. 
                                Las funcionalidades adicionales se implementarán gradualmente.</p>
                            </div>
                            
                            <div class="row mt-3">
                                <div class="col-md-6">
                                    <button class="btn btn-primary w-100" onclick="alert('Función de importación CSV en desarrollo')">
                                        <i class="bi bi-upload me-2"></i>Importar Leads CSV
                                    </button>
                                </div>
                                <div class="col-md-6">
                                    <button class="btn btn-success w-100" onclick="alert('Función de crear vendedor en desarrollo')">
                                        <i class="bi bi-person-plus me-2"></i>Crear Vendedor
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        dashboardHTML = `
            <div class="row">
                <div class="col-12">
                    <h2><i class="bi bi-person-badge me-2"></i>Panel del Vendedor</h2>
                    <p class="text-muted">Bienvenido ${user.name} - ${user.role}</p>
                </div>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-4 col-sm-6 mb-3">
                    <div class="card stat-card">
                        <div class="card-body text-center">
                            <h3>--</h3>
                            <p class="mb-0">Mis Leads</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 col-sm-6 mb-3">
                    <div class="card stat-card-success">
                        <div class="card-body text-center">
                            <h3>--</h3>
                            <p class="mb-0">Contactados</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 col-sm-6 mb-3">
                    <div class="card stat-card-warning">
                        <div class="card-body text-center">
                            <h3>--</h3>
                            <p class="mb-0">Pendientes</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="bi bi-check2-circle me-2"></i>Acceso de Vendedor</h5>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-info">
                                <h6><i class="bi bi-info-circle me-2"></i>Panel de Vendedor</h6>
                                <p class="mb-0">Has iniciado sesión correctamente como vendedor. 
                                Las funcionalidades de gestión de leads se implementarán próximamente.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    dashboardContainer.innerHTML = dashboardHTML;
}

// Helper functions
function showSpinner() {
    if (loadingSpinner) {
        loadingSpinner.style.display = 'flex';
    }
}

function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function hideLoginError() {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

function logout() {
    console.log('🚪 Logging out...');
    
    // Clear data
    currentUser = null;
    authToken = null;
    localStorage.removeItem('token');
    
    // Show login
    showLoginForm();
    
    // Reset form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.reset();
    }
    
    console.log('✅ Logged out successfully');
}

function loadDashboard() {
    if (currentUser) {
        loadDashboardContent(currentUser);
    }
}

console.log('📝 Simple app script loaded successfully');