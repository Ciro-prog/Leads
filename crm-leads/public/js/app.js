// Main Application Controller - Modular Architecture v2.0
class CRMApp {
  constructor() {
    this.currentView = null;
    this.isLoading = false;
    this.navigationModule = null;
    
    // UI Elements
    this.loadingSpinner = document.getElementById('loadingSpinner');
    this.loginContainer = document.getElementById('loginContainer');
    this.dashboardContainer = document.getElementById('dashboardContainer');
    this.navMenu = document.getElementById('navMenu');
    this.userDropdown = document.getElementById('userDropdown');
    this.userName = document.getElementById('userName');
    
    // Initialize application
    this.init();
  }

  async init() {
    console.log('🚀 Initializing CRM Application v2.0 - Modular Architecture...');
    
    try {
      // Wait for all required systems to be ready
      await this.waitForSystems();
      
      // Setup event listeners first
      this.setupEventListeners();
      
      // Show loading
      this.showLoading();
      
      // Small delay to ensure UI is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if user is already authenticated
      const isAuthenticated = await authManager.verifySession();
      
      if (isAuthenticated) {
        console.log('✅ User authenticated, showing modular dashboard');
        this.showDashboard();
      } else {
        console.log('❌ User not authenticated, showing login');
        this.showLogin();
      }
      
    } catch (error) {
      console.error('❌ App initialization error:', error);
      this.showError('Error al inicializar la aplicación');
      this.showLogin(); // Fallback to login on error
    } finally {
      // Ensure loading is hidden
      console.log('🔧 Hiding loading spinner');
      this.hideLoading();
    }
  }

  async waitForSystems() {
    // Wait for required global systems to be available
    const systems = ['stateManager', 'apiManager', 'componentRegistry', 'performanceMonitor'];
    const maxWait = 10000; // 10 seconds
    const checkInterval = 100; // 100ms
    let waited = 0;

    while (waited < maxWait) {
      const allReady = systems.every(system => window[system] !== undefined);
      
      if (allReady) {
        console.log('✅ All required systems ready:', systems);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }

    console.warn('⚠️ Some systems may not be ready:', {
      available: systems.filter(s => window[s]),
      missing: systems.filter(s => !window[s])
    });
  }

  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
    }

    // Brand link
    const brandLink = document.getElementById('brandLink');
    if (brandLink) {
      brandLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (authManager.isAuthenticated()) {
          this.showDashboard();
        }
      });
    }
  }

  async handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const credentials = {
      username: formData.get('username'),
      password: formData.get('password')
    };

    if (!credentials.username || !credentials.password) {
      this.showLoginError('Por favor ingrese usuario y contraseña');
      return;
    }

    try {
      this.showLoading();
      this.hideLoginError();

      const result = await authManager.login(credentials);

      if (result.success) {
        console.log('✅ Login successful');
        this.showToast('Bienvenido', `Hola ${result.user.name}`, 'success');
        this.showDashboard();
      } else {
        console.error('❌ Login failed:', result.message);
        this.showLoginError(result.message || 'Credenciales inválidas');
      }

    } catch (error) {
      console.error('❌ Login error:', error);
      this.showLoginError('Error de conexión al servidor');
    } finally {
      this.hideLoading();
    }
  }

  async handleLogout(event) {
    event.preventDefault();
    
    try {
      this.showLoading();
      
      // Clean up modular system
      if (this.navigationModule) {
        await this.navigationModule.destroy();
        this.navigationModule = null;
      }

      // Clean up all components
      if (window.componentRegistry) {
        await window.componentRegistry.destroyAll();
      }

      // Reset state manager
      if (window.stateManager) {
        window.stateManager.reset();
      }

      await authManager.logout();
      
      this.showToast('Sesión cerrada', 'Hasta pronto', 'info');
      this.showLogin();
      
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      this.hideLoading();
    }
  }

  showLogin() {
    this.currentView = 'login';
    
    // Hide loading spinner first
    this.hideLoading();
    
    // Show/hide appropriate containers
    this.loginContainer.style.display = 'block';
    this.dashboardContainer.style.display = 'none';
    this.userDropdown.style.display = 'none';
    this.navMenu.innerHTML = '';
    
    // Clear login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.reset();
    }
    this.hideLoginError();

    console.log('👤 Showing login view');
  }

  async showDashboard() {
    if (!authManager.isAuthenticated()) {
      this.showLogin();
      return;
    }

    try {
      this.currentView = 'dashboard';
      
      // Hide loading spinner
      this.hideLoading();
      
      // Show/hide appropriate containers
      this.loginContainer.style.display = 'none';
      this.dashboardContainer.style.display = 'block';
      this.userDropdown.style.display = 'block';
      
      // Update user info in navbar and state
      const user = authManager.getCurrentUser();
      if (this.userName && user) {
        this.userName.textContent = user.name;
      }

      // Initialize state manager with user data
      if (window.stateManager) {
        window.stateManager.setUser(user);
      }

      // Setup navigation menu based on role (simplified for modular system)
      this.setupSimpleNavigation(user);
      
      // Initialize enhanced systems but preserve original functionality
      await this.initializeNavigationModule();
      
      // Load the original dashboard content
      this.loadDashboardContent(user);

      // Ensure loading spinner is hidden after dashboard loads
      this.hideLoading();

      console.log('📊 Showing modular dashboard for:', user.role);
      
    } catch (error) {
      console.error('❌ Error showing dashboard:', error);
      this.showError('Error al cargar el dashboard');
      this.hideLoading(); // Hide spinner on error too
    }
  }

  setupSimpleNavigation(user) {
    // Restore original navigation functionality
    if (!user) return;

    let menuItems = '';

    if (user.role === 'admin') {
      menuItems = `
        <li class="nav-item">
          <a class="nav-link" href="#" id="dashboardLink">
            <i class="bi bi-speedometer2 me-1"></i>Dashboard
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#" id="leadsLink">
            <i class="bi bi-person-lines-fill me-1"></i>Leads
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#" id="usersLink">
            <i class="bi bi-people me-1"></i>Vendedores
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#" id="importLink">
            <i class="bi bi-upload me-1"></i>Importar
          </a>
        </li>
      `;
    } else {
      // For sellers
      menuItems = `
        <li class="nav-item">
          <a class="nav-link" href="#" id="dashboardLink">
            <i class="bi bi-speedometer2 me-1"></i>Dashboard
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#" id="myLeadsLink">
            <i class="bi bi-person-lines-fill me-1"></i>Mis Leads
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#" id="myStatsLink">
            <i class="bi bi-graph-up me-1"></i>Mis Estadísticas
          </a>
        </li>
      `;
    }

    if (this.navMenu) {
      this.navMenu.innerHTML = menuItems;
      
      // Restore original event listeners for navigation
      this.setupOriginalNavigation(user);
    }
  }

  setupOriginalNavigation(user) {
    // Restore the original navigation event listeners from index.html
    const dashboardLink = document.getElementById('dashboardLink');
    const leadsLink = document.getElementById('leadsLink');
    const usersLink = document.getElementById('usersLink');
    const importLink = document.getElementById('importLink');
    const myLeadsLink = document.getElementById('myLeadsLink');
    const myStatsLink = document.getElementById('myStatsLink');

    if (dashboardLink) {
      dashboardLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadDashboardContent(user);
      });
    }

    if (leadsLink) {
      leadsLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadLeadsManagement();
      });
    }

    if (usersLink) {
      usersLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadUsersManagement();
      });
    }

    if (importLink) {
      importLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadImportTool();
      });
    }

    if (myLeadsLink) {
      myLeadsLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadMyLeads();
      });
    }

    if (myStatsLink) {
      myStatsLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadMyStats();
      });
    }
  }

  async initializeNavigationModule() {
    try {
      console.log('🔄 Initializing enhanced navigation system (preserving original functionality)');
      
      // Don't destroy the existing dashboard content - enhance it instead
      // Just initialize the modular components in the background for future use
      
      // Setup performance monitoring and state management
      if (window.stateManager) {
        // Initialize state with current user
        const user = authManager.getCurrentUser();
        if (user) {
          window.stateManager.setUser(user);
        }
      }

      // Initialize API manager enhancements
      if (window.apiManager && window.performanceMonitor) {
        console.log('✅ Enhanced API management and performance monitoring active');
      }

      console.log('🧭 Enhanced navigation system ready (original functionality preserved)');
      
    } catch (error) {
      console.error('❌ Failed to initialize enhanced navigation:', error);
      // Don't show error to user - fall back to original system
    }
  }

  loadDashboardContent(user) {
    if (!this.dashboardContainer) return;
    
    console.log('🔄 Loading dashboard content for:', user.role);
    this.setActiveNavLink('dashboardLink');
    
    if (user.role === 'admin') {
      this.loadAdminDashboard();
    } else {
      this.loadSellerDashboard();
    }
  }

  async loadAdminDashboard() {
    try {
      // Show loading skeleton
      this.dashboardContainer.innerHTML = this.getDashboardSkeleton();
      
      // Load dashboard data using enhanced API manager
      const apiManager = window.apiManager || window.enhancedApiClient;
      
      const [leadsStatsResponse, usersStatsResponse] = await Promise.allSettled([
        apiManager.get('/leads/stats'),
        apiManager.get('/users/stats/dashboard')
      ]);
      
      let leadsStats = {};
      let usersStats = {};
      
      if (leadsStatsResponse.status === 'fulfilled') {
        leadsStats = leadsStatsResponse.value;
      }
      
      if (usersStatsResponse.status === 'fulfilled') {
        usersStats = usersStatsResponse.value.data || usersStatsResponse.value;
      }
      
      // Render dashboard with real data
      this.renderAdminDashboard(leadsStats, usersStats);
      
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
      this.showDashboardError('Error al cargar el dashboard administrativo');
    }
  }

  renderAdminDashboard(leadsStats, usersStats) {
    const html = `
      <div class="row">
        <div class="col-12">
          <h2><i class="bi bi-speedometer2 me-2"></i>Dashboard Administrativo</h2>
          <p class="text-muted">Panel de control del administrador</p>
        </div>
      </div>
      
      <!-- Statistics Cards -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card text-white bg-primary mb-3">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <div class="card-title h4">${leadsStats.total || 0}</div>
                  <p class="card-text">Total Leads</p>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-person-lines-fill" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card text-white bg-success mb-3">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <div class="card-title h4">${leadsStats.contacted || 0}</div>
                  <p class="card-text">Contactados</p>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-telephone-fill" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card text-white bg-warning mb-3">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <div class="card-title h4">${leadsStats.unassigned || 0}</div>
                  <p class="card-text">Sin Asignar</p>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-person-x-fill" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card text-white bg-info mb-3">
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <div>
                  <div class="card-title h4">${usersStats.overview?.activeSellers || usersStats.sellers || 0}</div>
                  <p class="card-text">Vendedores Activos</p>
                </div>
                <div class="align-self-center">
                  <i class="bi bi-people-fill" style="font-size: 2rem;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Acciones Rápidas</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-3 mb-2">
                  <button class="btn btn-primary w-100" onclick="app.loadLeadsManagement()">
                    <i class="bi bi-person-lines-fill me-2"></i>Ver Leads
                  </button>
                </div>
                <div class="col-md-3 mb-2">
                  <button class="btn btn-success w-100" onclick="app.loadUsersManagement()">
                    <i class="bi bi-people me-2"></i>Gestionar Vendedores
                  </button>
                </div>
                <div class="col-md-3 mb-2">
                  <button class="btn btn-info w-100" onclick="app.loadImportTool()">
                    <i class="bi bi-upload me-2"></i>Importar Leads
                  </button>
                </div>
                <div class="col-md-3 mb-2">
                  <button class="btn btn-secondary w-100" onclick="location.reload()">
                    <i class="bi bi-arrow-clockwise me-2"></i>Actualizar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.dashboardContainer.innerHTML = html;
  }

  getDashboardSkeleton() {
    return `
      <div class="row mb-4">
        <div class="col-12">
          <h2><i class="bi bi-speedometer2 me-2"></i>Dashboard</h2>
          <p class="text-muted">Cargando datos...</p>
        </div>
      </div>
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card mb-3">
            <div class="card-body">
              <div class="placeholder-glow">
                <span class="placeholder col-7"></span>
                <span class="placeholder col-4"></span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card mb-3">
            <div class="card-body">
              <div class="placeholder-glow">
                <span class="placeholder col-7"></span>
                <span class="placeholder col-4"></span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card mb-3">
            <div class="card-body">
              <div class="placeholder-glow">
                <span class="placeholder col-7"></span>
                <span class="placeholder col-4"></span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card mb-3">
            <div class="card-body">
              <div class="placeholder-glow">
                <span class="placeholder col-7"></span>
                <span class="placeholder col-4"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  showDashboardError(message) {
    this.dashboardContainer.innerHTML = `
      <div class="row">
        <div class="col-12">
          <div class="alert alert-danger">
            <h4><i class="bi bi-exclamation-triangle me-2"></i>Error</h4>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="location.reload()">Recargar Página</button>
          </div>
        </div>
      </div>
    `;
  }

  loadSellerDashboard() {
    this.dashboardContainer.innerHTML = `
      <div class="row">
        <div class="col-12">
          <h2><i class="bi bi-speedometer2 me-2"></i>Dashboard del Vendedor</h2>
          <p class="text-muted">Panel de control personal</p>
          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            Panel de vendedor disponible próximamente.
          </div>
        </div>
      </div>
    `;
  }

  setActiveNavLink(activeId) {
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    
    // Add active class to current link
    const activeLink = document.getElementById(activeId);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }

  async loadLeadsManagement() {
    console.log('🎯 Loading leads management...');
    this.setActiveNavLink('leadsLink');
    this.showLoading();
    
    try {
      // Load leads data from API
      const leadsResponse = await apiManager.get('/leads');
      const provincesResponse = await apiManager.get('/leads/provinces-with-unassigned');
      const sellersResponse = await apiManager.get('/users/sellers');
      
      const leads = leadsResponse.success ? leadsResponse.data.leads : [];
      const provinces = provincesResponse.success ? provincesResponse.data.provinces : [];
      const sellers = sellersResponse.success ? sellersResponse.data.sellers : [];
      
      this.dashboardContainer.innerHTML = `
        <div class="row">
          <div class="col-12">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h2><i class="bi bi-person-lines-fill me-2"></i>Gestión de Leads</h2>
              <div class="btn-group">
                <button class="btn btn-success" onclick="app.showCreateLeadModal()">
                  <i class="bi bi-plus me-2"></i>Nuevo Lead
                </button>
                <button class="btn btn-info" onclick="app.showBulkAssignModal()">
                  <i class="bi bi-distribute-vertical me-2"></i>Asignación Masiva
                </button>
                <button class="btn btn-outline-secondary" onclick="app.loadLeadsManagement()">
                  <i class="bi bi-arrow-clockwise me-2"></i>Actualizar
                </button>
              </div>
            </div>
            
            <!-- Filters and Search -->
            <div class="row mb-4">
              <div class="col-md-3">
                <label class="form-label">Buscar</label>
                <input type="text" class="form-control" id="leadsSearch" placeholder="Nombre, email o teléfono..." 
                       onkeyup="app.filterLeads()">
              </div>
              <div class="col-md-2">
                <label class="form-label">Estado</label>
                <select class="form-select" id="statusFilter" onchange="app.filterLeads()">
                  <option value="">Todos</option>
                  <option value="nuevo">Nuevo</option>
                  <option value="contactado">Contactado</option>
                  <option value="interesado">Interesado</option>
                  <option value="no_interesado">No Interesado</option>
                  <option value="vendido">Vendido</option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label">Vendedor</label>
                <select class="form-select" id="sellerFilter" onchange="app.filterLeads()">
                  <option value="">Todos</option>
                  <option value="unassigned">Sin Asignar</option>
                  ${sellers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label">Provincia</label>
                <select class="form-select" id="provinceFilter" onchange="app.filterLeads()">
                  <option value="">Todas</option>
                  ${provinces.map(p => `<option value="${p}">${p}</option>`).join('')}
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Rango de Fechas</label>
                <div class="input-group">
                  <input type="date" class="form-control" id="dateFromFilter" onchange="app.filterLeads()">
                  <input type="date" class="form-control" id="dateToFilter" onchange="app.filterLeads()">
                </div>
              </div>
            </div>
            
            <!-- Leads Summary Cards -->
            <div class="row mb-4">
              <div class="col-md-2">
                <div class="card bg-primary text-white">
                  <div class="card-body text-center">
                    <h5 id="totalLeadsCount">${leads.length}</h5>
                    <small>Total Leads</small>
                  </div>
                </div>
              </div>
              <div class="col-md-2">
                <div class="card bg-warning text-white">
                  <div class="card-body text-center">
                    <h5 id="unassignedLeadsCount">${leads.filter(l => !l.assigned_to).length}</h5>
                    <small>Sin Asignar</small>
                  </div>
                </div>
              </div>
              <div class="col-md-2">
                <div class="card bg-info text-white">
                  <div class="card-body text-center">
                    <h5 id="newLeadsCount">${leads.filter(l => l.status === 'nuevo').length}</h5>
                    <small>Nuevos</small>
                  </div>
                </div>
              </div>
              <div class="col-md-2">
                <div class="card bg-secondary text-white">
                  <div class="card-body text-center">
                    <h5 id="contactedLeadsCount">${leads.filter(l => l.status === 'contactado').length}</h5>
                    <small>Contactados</small>
                  </div>
                </div>
              </div>
              <div class="col-md-2">
                <div class="card bg-success text-white">
                  <div class="card-body text-center">
                    <h5 id="interestedLeadsCount">${leads.filter(l => l.status === 'interesado').length}</h5>
                    <small>Interesados</small>
                  </div>
                </div>
              </div>
              <div class="col-md-2">
                <div class="card bg-dark text-white">
                  <div class="card-body text-center">
                    <h5 id="soldLeadsCount">${leads.filter(l => l.status === 'vendido').length}</h5>
                    <small>Vendidos</small>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Leads Table -->
            <div class="card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <span><i class="bi bi-table me-2"></i>Lista de Leads</span>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-secondary" onclick="app.selectAllLeads(true)">
                    <i class="bi bi-check-all"></i> Seleccionar Todo
                  </button>
                  <button class="btn btn-outline-secondary" onclick="app.selectAllLeads(false)">
                    <i class="bi bi-x"></i> Deseleccionar
                  </button>
                </div>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-hover" id="leadsTable">
                    <thead>
                      <tr>
                        <th width="30"><input type="checkbox" id="selectAllCheckbox" onchange="app.toggleSelectAll()"></th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Provincia</th>
                        <th>Vendedor</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th width="120">Acciones</th>
                      </tr>
                    </thead>
                    <tbody id="leadsTableBody">
                      ${this.renderLeadsTableRows(leads, sellers)}
                    </tbody>
                  </table>
                </div>
                
                <!-- Pagination -->
                <div class="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <span class="text-muted">Mostrando <span id="showingCount">${leads.length}</span> de <span id="totalCount">${leads.length}</span> leads</span>
                  </div>
                  <nav id="paginationNav">
                    <!-- Pagination will be rendered here -->
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Store leads data for filtering
      this.leadsData = { leads, sellers, provinces };
      this.filteredLeads = leads;
      
      // Initialize tooltips
      this.initializeTooltips();
      
    } catch (error) {
      console.error('❌ Error loading leads management:', error);
      this.showError('Error al cargar la gestión de leads');
    } finally {
      this.hideLoading();
    }
  }

  async loadUsersManagement() {
    console.log('👥 Loading users management...');
    this.setActiveNavLink('usersLink');
    this.showLoading();
    
    try {
      // Load users data from API
      const usersResponse = await apiManager.get('/users');
      const sellersResponse = await apiManager.get('/users/sellers');
      const statsResponse = await apiManager.get('/users/stats/dashboard');
      
      const users = usersResponse.success ? usersResponse.data.users : [];
      const sellers = sellersResponse.success ? sellersResponse.data.sellers : [];
      const stats = statsResponse.success ? statsResponse.data : {};
      
      this.dashboardContainer.innerHTML = `
        <div class="row">
          <div class="col-12">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h2><i class="bi bi-people me-2"></i>Gestión de Vendedores</h2>
              <div class="btn-group">
                <button class="btn btn-success" onclick="app.showCreateUserModal()">
                  <i class="bi bi-person-plus me-2"></i>Nuevo Vendedor
                </button>
                <button class="btn btn-outline-secondary" onclick="app.loadUsersManagement()">
                  <i class="bi bi-arrow-clockwise me-2"></i>Actualizar
                </button>
              </div>
            </div>
            
            <!-- Users Summary Cards -->
            <div class="row mb-4">
              <div class="col-md-3">
                <div class="card bg-primary text-white">
                  <div class="card-body text-center">
                    <h4>${users.length}</h4>
                    <small>Total Usuarios</small>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-success text-white">
                  <div class="card-body text-center">
                    <h4>${sellers.length}</h4>
                    <small>Vendedores Activos</small>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-warning text-white">
                  <div class="card-body text-center">
                    <h4>${stats.activeUsers || 0}</h4>
                    <small>Usuarios Activos</small>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-info text-white">
                  <div class="card-body text-center">
                    <h4>${users.filter(u => u.role === 'admin').length}</h4>
                    <small>Administradores</small>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Filters -->
            <div class="row mb-4">
              <div class="col-md-4">
                <label class="form-label">Buscar Usuario</label>
                <input type="text" class="form-control" id="usersSearch" placeholder="Nombre, email o username..." 
                       onkeyup="app.filterUsers()">
              </div>
              <div class="col-md-3">
                <label class="form-label">Rol</label>
                <select class="form-select" id="roleFilter" onchange="app.filterUsers()">
                  <option value="">Todos los roles</option>
                  <option value="admin">Administrador</option>
                  <option value="seller">Vendedor</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Estado</label>
                <select class="form-select" id="statusFilter" onchange="app.filterUsers()">
                  <option value="">Todos</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
              <div class="col-md-2">
                <label class="form-label">&nbsp;</label>
                <div>
                  <button class="btn btn-outline-primary w-100" onclick="app.exportUsersData()">
                    <i class="bi bi-download me-2"></i>Exportar
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Users Table -->
            <div class="card">
              <div class="card-header">
                <h5 class="mb-0"><i class="bi bi-table me-2"></i>Lista de Usuarios</h5>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-hover" id="usersTable">
                    <thead>
                      <tr>
                        <th>Usuario</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Leads Asignados</th>
                        <th>Último Acceso</th>
                        <th>Fecha Registro</th>
                        <th width="150">Acciones</th>
                      </tr>
                    </thead>
                    <tbody id="usersTableBody">
                      ${this.renderUsersTableRows(users)}
                    </tbody>
                  </table>
                </div>
                
                <!-- Pagination -->
                <div class="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <span class="text-muted">Mostrando <span id="showingUsersCount">${users.length}</span> de <span id="totalUsersCount">${users.length}</span> usuarios</span>
                  </div>
                  <nav id="usersPaginationNav">
                    <!-- Pagination will be rendered here -->
                  </nav>
                </div>
              </div>
            </div>
            
            <!-- User Performance Section -->
            <div class="row mt-4">
              <div class="col-md-6">
                <div class="card">
                  <div class="card-header">
                    <h5 class="mb-0"><i class="bi bi-graph-up me-2"></i>Rendimiento de Vendedores</h5>
                  </div>
                  <div class="card-body">
                    <div class="table-responsive">
                      <table class="table table-sm">
                        <thead>
                          <tr>
                            <th>Vendedor</th>
                            <th>Leads Asignados</th>
                            <th>Conversiones</th>
                            <th>Tasa de Éxito</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${this.renderSellerPerformanceRows(sellers)}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="col-md-6">
                <div class="card">
                  <div class="card-header">
                    <h5 class="mb-0"><i class="bi bi-activity me-2"></i>Actividad Reciente</h5>
                  </div>
                  <div class="card-body">
                    <div class="timeline-activity">
                      ${this.renderRecentUserActivity(users)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Store users data for filtering
      this.usersData = { users, sellers, stats };
      this.filteredUsers = users;
      
      // Initialize tooltips
      this.initializeTooltips();
      
    } catch (error) {
      console.error('❌ Error loading users management:', error);
      this.showError('Error al cargar la gestión de usuarios');
    } finally {
      this.hideLoading();
    }
  }

  async loadImportTool() {
    console.log('📤 Loading import tool...');
    this.setActiveNavLink('importLink');
    this.showLoading();
    
    try {
      // Load import history and available sellers
      const historyResponse = await apiManager.get('/import/history');
      const sellersResponse = await apiManager.get('/users/sellers');
      
      const importHistory = historyResponse.success ? historyResponse.data.imports : [];
      const sellers = sellersResponse.success ? sellersResponse.data.sellers : [];
      
      this.dashboardContainer.innerHTML = `
        <div class="row">
          <div class="col-12">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h2><i class="bi bi-upload me-2"></i>Importar Leads</h2>
              <div class="btn-group">
                <button class="btn btn-success" onclick="app.showImportModal()">
                  <i class="bi bi-file-earmark-arrow-up me-2"></i>Nueva Importación
                </button>
                <button class="btn btn-outline-secondary" onclick="app.downloadImportTemplate()">
                  <i class="bi bi-download me-2"></i>Descargar Plantilla
                </button>
                <button class="btn btn-outline-secondary" onclick="app.loadImportTool()">
                  <i class="bi bi-arrow-clockwise me-2"></i>Actualizar
                </button>
              </div>
            </div>
            
            <!-- Import Instructions -->
            <div class="row mb-4">
              <div class="col-md-8">
                <div class="card">
                  <div class="card-header">
                    <h5 class="mb-0"><i class="bi bi-info-circle me-2"></i>Instrucciones de Importación</h5>
                  </div>
                  <div class="card-body">
                    <div class="row">
                      <div class="col-md-6">
                        <h6>Formatos Aceptados</h6>
                        <ul>
                          <li><i class="bi bi-filetype-csv text-success"></i> CSV (recomendado)</li>
                          <li><i class="bi bi-filetype-xlsx text-primary"></i> Excel (.xlsx)</li>
                          <li><i class="bi bi-filetype-xls text-primary"></i> Excel (.xls)</li>
                        </ul>
                        
                        <h6 class="mt-3">Campos Requeridos</h6>
                        <ul>
                          <li><strong>nombre</strong> - Nombre del lead</li>
                          <li><strong>email</strong> - Email del lead</li>
                        </ul>
                      </div>
                      <div class="col-md-6">
                        <h6>Campos Opcionales</h6>
                        <ul>
                          <li><strong>telefono</strong> - Teléfono</li>
                          <li><strong>provincia</strong> - Provincia</li>
                          <li><strong>empresa</strong> - Empresa</li>
                          <li><strong>notas</strong> - Notas adicionales</li>
                        </ul>
                        
                        <h6 class="mt-3">Límites</h6>
                        <ul>
                          <li>Máximo 1,000 registros por archivo</li>
                          <li>Tamaño máximo: 5MB</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div class="alert alert-warning mt-3">
                      <i class="bi bi-exclamation-triangle me-2"></i>
                      <strong>Importante:</strong> Los emails duplicados serán ignorados durante la importación.
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="col-md-4">
                <div class="card">
                  <div class="card-header">
                    <h5 class="mb-0"><i class="bi bi-graph-up me-2"></i>Estadísticas</h5>
                  </div>
                  <div class="card-body">
                    <div class="row text-center">
                      <div class="col-6">
                        <div class="border-end">
                          <h4 class="text-primary">${importHistory.length}</h4>
                          <small class="text-muted">Importaciones</small>
                        </div>
                      </div>
                      <div class="col-6">
                        <h4 class="text-success">${importHistory.reduce((sum, imp) => sum + (imp.processed_records || 0), 0)}</h4>
                        <small class="text-muted">Registros Procesados</small>
                      </div>
                    </div>
                    
                    <div class="row text-center mt-3">
                      <div class="col-6">
                        <div class="border-end">
                          <h4 class="text-success">${importHistory.reduce((sum, imp) => sum + (imp.successful_records || 0), 0)}</h4>
                          <small class="text-muted">Exitosos</small>
                        </div>
                      </div>
                      <div class="col-6">
                        <h4 class="text-danger">${importHistory.reduce((sum, imp) => sum + (imp.failed_records || 0), 0)}</h4>
                        <small class="text-muted">Fallidos</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Import History -->
            <div class="card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="bi bi-clock-history me-2"></i>Historial de Importaciones</h5>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-danger" onclick="app.clearImportHistory()" 
                          ${importHistory.length === 0 ? 'disabled' : ''}>
                    <i class="bi bi-trash me-2"></i>Limpiar Historial
                  </button>
                </div>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th>Archivo</th>
                        <th>Estado</th>
                        <th>Procesados</th>
                        <th>Exitosos</th>
                        <th>Fallidos</th>
                        <th>Fecha</th>
                        <th>Usuario</th>
                        <th width="120">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${this.renderImportHistoryRows(importHistory)}
                    </tbody>
                  </table>
                </div>
                
                ${importHistory.length === 0 ? `
                  <div class="text-center text-muted py-4">
                    <i class="bi bi-inbox display-4 d-block mb-2"></i>
                    No se han realizado importaciones aún
                  </div>
                ` : ''}
              </div>
            </div>
            
            <!-- Processing Status (initially hidden) -->
            <div class="card mt-4" id="importProgressCard" style="display: none;">
              <div class="card-header">
                <h5 class="mb-0"><i class="bi bi-hourglass-split me-2"></i>Procesando Importación...</h5>
              </div>
              <div class="card-body">
                <div class="progress mb-3">
                  <div class="progress-bar progress-bar-striped progress-bar-animated" 
                       id="importProgress" style="width: 0%"></div>
                </div>
                <div id="importStatus">Preparando importación...</div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Store import data
      this.importData = { history: importHistory, sellers };
      
    } catch (error) {
      console.error('❌ Error loading import tool:', error);
      this.showError('Error al cargar la herramienta de importación');
    } finally {
      this.hideLoading();
    }
  }

  loadMyLeads() {
    console.log('📋 Loading my leads...');
    this.setActiveNavLink('myLeadsLink');
    
    this.dashboardContainer.innerHTML = `
      <div class="row">
        <div class="col-12">
          <h2><i class="bi bi-person-lines-fill me-2"></i>Mis Leads</h2>
          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            Panel de leads personales disponible próximamente.
          </div>
          <button class="btn btn-primary" onclick="app.loadDashboardContent(app.getCurrentUser())">
            <i class="bi bi-arrow-left me-2"></i>Volver al Dashboard
          </button>
        </div>
      </div>
    `;
  }

  loadMyStats() {
    console.log('📊 Loading my stats...');
    this.setActiveNavLink('myStatsLink');
    
    this.dashboardContainer.innerHTML = `
      <div class="row">
        <div class="col-12">
          <h2><i class="bi bi-graph-up me-2"></i>Mis Estadísticas</h2>
          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            Estadísticas personales disponibles próximamente.
          </div>
          <button class="btn btn-primary" onclick="app.loadDashboardContent(app.getCurrentUser())">
            <i class="bi bi-arrow-left me-2"></i>Volver al Dashboard
          </button>
        </div>
      </div>
    `;
  }

  getCurrentUser() {
    return authManager.getCurrentUser();
  }

  setupNavigation(user) {
    if (!user) return;

    let menuItems = '';

    if (user.role === 'admin') {
      menuItems = `
        <li class="nav-item">
          <a class="nav-link" href="#" id="dashboardLink">
            <i class="bi bi-speedometer2 me-1"></i>Dashboard
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#" id="leadsLink">
            <i class="bi bi-person-lines-fill me-1"></i>Leads
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#" id="usersLink">
            <i class="bi bi-people me-1"></i>Vendedores
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#" id="importLink">
            <i class="bi bi-upload me-1"></i>Importar
          </a>
        </li>
      `;
    } else if (user.role === 'seller') {
      menuItems = `
        <li class="nav-item">
          <a class="nav-link" href="#" id="myLeadsLink">
            <i class="bi bi-person-lines-fill me-1"></i>Mis Leads
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#" id="myStatsLink">
            <i class="bi bi-graph-up me-1"></i>Mis Stats
          </a>
        </li>
      `;
    }

    this.navMenu.innerHTML = menuItems;

    // Add event listeners to navigation
    this.setupNavigationEvents();
  }

  setupNavigationEvents() {
    // Clean previous event listeners to prevent duplicates
    this.cleanupNavigationEvents();
    
    // Admin navigation
    const dashboardLink = document.getElementById('dashboardLink');
    if (dashboardLink) {
      const handler = (e) => {
        e.preventDefault();
        this.navigateToTab('dashboard', () => this.loadDashboardContent());
      };
      dashboardLink.addEventListener('click', handler);
      this.navigationState.eventListeners.set('dashboardLink', { element: dashboardLink, handler });
    }

    const leadsLink = document.getElementById('leadsLink');
    if (leadsLink) {
      const handler = (e) => {
        e.preventDefault();
        this.navigateToTab('leads', () => this.loadLeadsContentOptimized());
      };
      leadsLink.addEventListener('click', handler);
      this.navigationState.eventListeners.set('leadsLink', { element: leadsLink, handler });
    }

    const usersLink = document.getElementById('usersLink');
    if (usersLink) {
      const handler = (e) => {
        e.preventDefault();
        this.navigateToTab('vendedores', () => this.loadSellersContent());
      };
      usersLink.addEventListener('click', handler);
      this.navigationState.eventListeners.set('usersLink', { element: usersLink, handler });
    }

    const importLink = document.getElementById('importLink');
    if (importLink) {
      const handler = (e) => {
        e.preventDefault();
        this.navigateToTab('importar', () => this.loadImportContent());
      };
      importLink.addEventListener('click', handler);
      this.navigationState.eventListeners.set('importLink', { element: importLink, handler });
    }

    // Seller navigation  
    const myLeadsLink = document.getElementById('myLeadsLink');
    if (myLeadsLink) {
      myLeadsLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadMyLeads();
      });
    }
  }

  // Navigation State Manager Methods
  cleanupNavigationEvents() {
    this.navigationState.eventListeners.forEach(({ element, handler }) => {
      if (element) {
        element.removeEventListener('click', handler);
      }
    });
    this.navigationState.eventListeners.clear();
  }

  async navigateToTab(tabName, loadFunction) {
    // Prevent multiple navigation during loading
    if (this.navigationState.isLoading) {
      console.log(`⚠️ Navigation blocked - already loading ${this.navigationState.currentTab}`);
      return;
    }

    // Skip if already on this tab
    if (this.navigationState.currentTab === tabName) {
      console.log(`ℹ️ Already on ${tabName} tab`);
      return;
    }

    console.log(`🔄 Navigating to ${tabName}...`);
    this.navigationState.isLoading = true;
    this.navigationState.currentTab = tabName;

    try {
      // Update navigation visual state
      this.updateNavigationState(tabName);
      
      // Show loading indicator specific to tab
      this.showTabLoading(tabName);
      
      // Load content
      await loadFunction();
      
      this.navigationState.loadedTabs.add(tabName);
      console.log(`✅ Successfully navigated to ${tabName}`);
      
    } catch (error) {
      console.error(`❌ Navigation to ${tabName} failed:`, error);
      this.showNavigationError(tabName, error);
    } finally {
      this.navigationState.isLoading = false;
    }
  }

  updateNavigationState(activeTab) {
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    
    const activeLink = document.getElementById(`${activeTab === 'vendedores' ? 'users' : activeTab === 'importar' ? 'import' : activeTab}Link`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }

  showTabLoading(tabType = 'generic') {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    console.log(`🎨 Loading skeleton for ${tabType} tab...`);
    
    switch(tabType) {
      case 'dashboard':
        this.showDashboardSkeleton(mainContent);
        break;
      case 'importar':
        this.showImportSkeleton(mainContent);
        break;
      case 'vendedores':
        this.showSellersSkeleton(mainContent);
        break;
      case 'leads':
        this.showLeadsSkeleton(mainContent);
        break;
      default:
        // Fallback to generic loading
        mainContent.innerHTML = `
          <div class="d-flex justify-content-center align-items-center" style="min-height: 300px;">
            <div class="text-center">
              <div class="spinner-border text-primary mb-3" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
              <p class="text-muted">Cargando contenido...</p>
            </div>
          </div>
        `;
    }
  }

  showDashboardSkeleton(mainContent) {
    mainContent.innerHTML = `
      <div class="dashboard-skeleton">
        <!-- Header -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="skeleton-text skeleton-text-lg mb-2" style="width: 300px; height: 28px;"></div>
            <div class="skeleton-text skeleton-text-md" style="width: 200px; height: 16px;"></div>
          </div>
        </div>
        
        <!-- Stats Cards -->
        <div class="row mb-4">
          <div class="col-md-3 col-sm-6 mb-3">
            <div class="card stat-card">
              <div class="card-body text-center">
                <div class="skeleton-text skeleton-text-lg mx-auto mb-2" style="width: 60px; height: 32px;"></div>
                <div class="skeleton-text skeleton-text-sm mx-auto" style="width: 100px; height: 16px;"></div>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-sm-6 mb-3">
            <div class="card stat-card-success">
              <div class="card-body text-center">
                <div class="skeleton-text skeleton-text-lg mx-auto mb-2" style="width: 60px; height: 32px;"></div>
                <div class="skeleton-text skeleton-text-sm mx-auto" style="width: 120px; height: 16px;"></div>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-sm-6 mb-3">
            <div class="card stat-card-warning">
              <div class="card-body text-center">
                <div class="skeleton-text skeleton-text-lg mx-auto mb-2" style="width: 60px; height: 32px;"></div>
                <div class="skeleton-text skeleton-text-sm mx-auto" style="width: 90px; height: 16px;"></div>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-sm-6 mb-3">
            <div class="card stat-card-danger">
              <div class="card-body text-center">
                <div class="skeleton-text skeleton-text-lg mx-auto mb-2" style="width: 60px; height: 32px;"></div>
                <div class="skeleton-text skeleton-text-sm mx-auto" style="width: 110px; height: 16px;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="row">
          <div class="col-md-6 mb-3">
            <div class="card">
              <div class="card-header">
                <div class="skeleton-text skeleton-text-md" style="width: 150px; height: 20px;"></div>
              </div>
              <div class="card-body">
                <div class="skeleton-text skeleton-text-sm mb-2" style="width: 200px; height: 16px;"></div>
                <div class="skeleton-actions" style="width: 120px; height: 38px;"></div>
              </div>
            </div>
          </div>
          <div class="col-md-6 mb-3">
            <div class="card">
              <div class="card-header">
                <div class="skeleton-text skeleton-text-md" style="width: 180px; height: 20px;"></div>
              </div>
              <div class="card-body">
                <div class="skeleton-text skeleton-text-sm mb-2" style="width: 180px; height: 16px;"></div>
                <div class="skeleton-actions" style="width: 100px; height: 38px;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  showImportSkeleton(mainContent) {
    mainContent.innerHTML = `
      <div class="import-skeleton">
        <!-- Header -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="skeleton-text skeleton-text-lg mb-2" style="width: 250px; height: 28px;"></div>
            <div class="skeleton-text skeleton-text-md" style="width: 400px; height: 16px;"></div>
          </div>
        </div>
        
        <!-- Tabs Navigation -->
        <div class="row">
          <div class="col-12">
            <div class="d-flex gap-3 mb-4">
              <div class="skeleton-badge" style="width: 140px; height: 42px; border-radius: 6px;"></div>
              <div class="skeleton-badge" style="width: 160px; height: 42px; border-radius: 6px;"></div>
              <div class="skeleton-badge" style="width: 120px; height: 42px; border-radius: 6px;"></div>
              <div class="skeleton-badge" style="width: 100px; height: 42px; border-radius: 6px;"></div>
            </div>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="row">
          <div class="col-md-8">
            <div class="card">
              <div class="card-body">
                <div class="skeleton-text skeleton-text-md mb-3" style="width: 200px; height: 20px;"></div>
                <div class="skeleton-text skeleton-text-lg mb-4" style="width: 100%; height: 56px; border-radius: 8px;"></div>
                <div class="skeleton-actions" style="width: 150px; height: 38px;"></div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card">
              <div class="card-header">
                <div class="skeleton-text skeleton-text-md" style="width: 120px; height: 20px;"></div>
              </div>
              <div class="card-body">
                <div class="skeleton-text skeleton-text-sm mb-2" style="width: 100px; height: 16px;"></div>
                <div class="skeleton-text skeleton-text-sm mb-2" style="width: 120px; height: 16px;"></div>
                <div class="skeleton-text skeleton-text-sm mb-2" style="width: 80px; height: 16px;"></div>
                <div class="skeleton-text skeleton-text-sm" style="width: 140px; height: 16px;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  showSellersSkeleton(mainContent) {
    mainContent.innerHTML = `
      <div class="sellers-skeleton">
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <div class="skeleton-text skeleton-text-lg mb-2" style="width: 280px; height: 28px;"></div>
            <div class="skeleton-text skeleton-text-md" style="width: 300px; height: 16px;"></div>
          </div>
          <div class="skeleton-actions" style="width: 150px; height: 38px;"></div>
        </div>

        <!-- Statistics Overview -->
        <div class="row mb-4">
          <div class="col-md-3">
            <div class="card stat-card-primary">
              <div class="card-body text-center">
                <div class="skeleton-text skeleton-text-lg mx-auto mb-2" style="width: 50px; height: 32px;"></div>
                <div class="skeleton-text skeleton-text-sm mx-auto" style="width: 100px; height: 16px;"></div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card stat-card-success">
              <div class="card-body text-center">
                <div class="skeleton-text skeleton-text-lg mx-auto mb-2" style="width: 50px; height: 32px;"></div>
                <div class="skeleton-text skeleton-text-sm mx-auto" style="width: 120px; height: 16px;"></div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card stat-card-warning">
              <div class="card-body text-center">
                <div class="skeleton-text skeleton-text-lg mx-auto mb-2" style="width: 50px; height: 32px;"></div>
                <div class="skeleton-text skeleton-text-sm mx-auto" style="width: 90px; height: 16px;"></div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card stat-card-info">
              <div class="card-body text-center">
                <div class="skeleton-text skeleton-text-lg mx-auto mb-2" style="width: 50px; height: 32px;"></div>
                <div class="skeleton-text skeleton-text-sm mx-auto" style="width: 110px; height: 16px;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sellers Table -->
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <div class="skeleton-text skeleton-text-md" style="width: 200px; height: 20px;"></div>
            <div class="skeleton-actions" style="width: 120px; height: 32px;"></div>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th><div class="skeleton-text skeleton-text-sm" style="width: 80px; height: 16px;"></div></th>
                    <th><div class="skeleton-text skeleton-text-sm" style="width: 60px; height: 16px;"></div></th>
                    <th><div class="skeleton-text skeleton-text-sm" style="width: 100px; height: 16px;"></div></th>
                    <th><div class="skeleton-text skeleton-text-sm" style="width: 80px; height: 16px;"></div></th>
                    <th><div class="skeleton-text skeleton-text-sm" style="width: 90px; height: 16px;"></div></th>
                  </tr>
                </thead>
                <tbody>
                  ${Array(5).fill().map(() => `
                    <tr class="skeleton-row">
                      <td><div class="skeleton-text skeleton-text-md" style="width: 120px; height: 20px;"></div></td>
                      <td><div class="skeleton-badge" style="width: 60px; height: 24px;"></div></td>
                      <td><div class="skeleton-text skeleton-text-sm" style="width: 80px; height: 16px;"></div></td>
                      <td><div class="skeleton-text skeleton-text-sm" style="width: 100px; height: 16px;"></div></td>
                      <td><div class="skeleton-actions" style="width: 80px; height: 32px;"></div></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  showLeadsSkeleton(mainContent) {
    // Use existing optimized leads skeleton or create a basic one
    mainContent.innerHTML = `
      <div class="leads-skeleton">
        <!-- Header -->
        <div class="row">
          <div class="col-12">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <div>
                <div class="skeleton-text skeleton-text-lg mb-2" style="width: 250px; height: 28px;"></div>
                <div class="skeleton-text skeleton-text-md" style="width: 350px; height: 16px;"></div>
              </div>
              <div class="skeleton-actions" style="width: 120px; height: 38px;"></div>
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="row mb-4">
          ${Array(4).fill().map(() => `
            <div class="col-md-3">
              <div class="card stat-card-primary">
                <div class="card-body text-center">
                  <div class="skeleton-text skeleton-text-lg mx-auto mb-2" style="width: 60px; height: 32px;"></div>
                  <div class="skeleton-text skeleton-text-sm mx-auto" style="width: 100px; height: 16px;"></div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Table -->
        <div class="card">
          <div class="card-body">
            <div class="table-responsive">
              <table class="table">
                <tbody>
                  ${Array(10).fill().map(() => `
                    <tr class="skeleton-row">
                      <td><div class="skeleton-checkbox"></div></td>
                      <td><div class="skeleton-text skeleton-text-lg"></div></td>
                      <td><div class="skeleton-text skeleton-text-md"></div></td>
                      <td><div class="skeleton-text skeleton-text-sm"></div></td>
                      <td><div class="skeleton-text skeleton-text-md"></div></td>
                      <td><div class="skeleton-badge"></div></td>
                      <td><div class="skeleton-text skeleton-text-sm"></div></td>
                      <td><div class="skeleton-actions"></div></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  showNavigationError(tabName, error) {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="alert alert-danger">
          <h4>Error de Navegación</h4>
          <p>No se pudo cargar el contenido de ${tabName}: ${error.message}</p>
          <button class="btn btn-primary" onclick="window.crmApp.navigateToTab('${tabName}', () => window.crmApp.load${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Content())">
            Reintentar
          </button>
        </div>
      `;
    }
  }

  loadDashboardContent() {
    const user = authManager.getCurrentUser();
    if (!user) return;

    let dashboardHTML = '';

    if (user.role === 'admin') {
      dashboardHTML = `
        <div class="row">
          <div class="col-12">
            <h2><i class="bi bi-speedometer2 me-2"></i>Dashboard Administrativo</h2>
            <p class="text-muted">Bienvenido ${user.name}</p>
          </div>
        </div>
        
        <div class="row mb-4">
          <div class="col-md-3 col-sm-6 mb-3">
            <div class="card stat-card">
              <div class="card-body text-center">
                <h3 id="totalLeads">--</h3>
                <p class="mb-0">Total Leads</p>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-sm-6 mb-3">
            <div class="card stat-card-success">
              <div class="card-body text-center">
                <h3 id="activeSellers">--</h3>
                <p class="mb-0">Vendedores Activos</p>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-sm-6 mb-3">
            <div class="card stat-card-warning">
              <div class="card-body text-center">
                <h3 id="unassignedLeads">--</h3>
                <p class="mb-0">Sin Asignar</p>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-sm-6 mb-3">
            <div class="card stat-card-danger">
              <div class="card-body text-center">
                <h3 id="totalSellers">--</h3>
                <p class="mb-0">Total Vendedores</p>
              </div>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-12">
            <div class="card">
              <div class="card-header">
                <h5><i class="bi bi-list-task me-2"></i>Acciones Rápidas</h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <button id="importLeadsBtn" class="btn btn-primary w-100">
                      <i class="bi bi-upload me-2"></i>Importar Leads CSV
                    </button>
                  </div>
                  <div class="col-md-6 mb-3">
                    <button id="createSellerBtn" class="btn btn-success w-100">
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
            <p class="text-muted">Bienvenido ${user.name}</p>
          </div>
        </div>
        
        <div class="row mb-4">
          <div class="col-md-4 col-sm-6 mb-3">
            <div class="card stat-card">
              <div class="card-body text-center">
                <h3 id="myTotalLeads">--</h3>
                <p class="mb-0">Mis Leads</p>
              </div>
            </div>
          </div>
          <div class="col-md-4 col-sm-6 mb-3">
            <div class="card stat-card-success">
              <div class="card-body text-center">
                <h3 id="myContactedLeads">--</h3>
                <p class="mb-0">Contactados</p>
              </div>
            </div>
          </div>
          <div class="col-md-4 col-sm-6 mb-3">
            <div class="card stat-card-warning">
              <div class="card-body text-center">
                <h3 id="myPendingLeads">--</h3>
                <p class="mb-0">Pendientes</p>
              </div>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-12">
            <div class="card">
              <div class="card-header">
                <h5><i class="bi bi-list me-2"></i>Mis Leads Recientes</h5>
              </div>
              <div class="card-body">
                <div id="recentLeads">
                  <p class="text-muted">Cargando leads...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    this.dashboardContainer.innerHTML = dashboardHTML;
    
    // Setup event listeners for buttons
    this.setupDashboardEventListeners();
    
    // Load stats after rendering
    this.loadDashboardStats();
  }

  async loadDashboardStats() {
    // Usar el dashboardManager para cargar estadísticas
    if (typeof dashboardManager !== 'undefined') {
      await dashboardManager.init();
    } else {
      console.log('📊 Dashboard manager not available, loading basic stats...');
      // Fallback básico si el dashboard.js no está cargado
      await this.loadBasicStats();
    }
  }

  async loadBasicStats() {
    try {
      const response = await apiManager.get('/users/stats/dashboard');
      if (response.success) {
        const stats = response.data;
        this.updateElement('totalLeads', stats.overview.totalLeads);
        this.updateElement('activeSellers', stats.overview.activeSellers);
        this.updateElement('unassignedLeads', stats.overview.unassignedLeads);
        this.updateElement('totalSellers', stats.overview.totalSellers);
      }
    } catch (error) {
      console.error('Error loading basic stats:', error);
    }
  }

  updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  setupDashboardEventListeners() {
    // Setup event listeners for dashboard buttons
    const createSellerBtn = document.getElementById('createSellerBtn');
    const importLeadsBtn = document.getElementById('importLeadsBtn');

    if (createSellerBtn) {
      createSellerBtn.addEventListener('click', () => {
        showCreateUserModal();
      });
    }

    if (importLeadsBtn) {
      importLeadsBtn.addEventListener('click', () => {
        showImportModal();
      });
    }
  }

  loadMyLeads() {
    // This will be implemented when leads.js is created
    console.log('📋 Loading my leads...');
  }

  async loadLeadsContentOptimized() {
    console.log('📋 Loading optimized leads content...');
    const user = authManager.getCurrentUser();
    if (!user) return;

    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    try {
      // Show initial structure immediately
      const leadsHTML = `
        <div class="row">
          <div class="col-12">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2><i class="bi bi-person-lines-fill me-2"></i>Gestión de Leads</h2>
                <p class="text-muted mb-0">Administrar y gestionar todos los leads del sistema</p>
              </div>
              <button class="btn btn-primary" id="addLeadBtn">
                <i class="bi bi-plus me-1"></i>Nuevo Lead
              </button>
            </div>
          </div>
        </div>

        <!-- Quick Stats (Load immediately) -->
        <div class="row mb-4" id="leadsStatsContainer">
          <div class="col-md-3">
            <div class="card stat-card-primary">
              <div class="card-body text-center">
                <div class="spinner-border spinner-border-sm mb-2" role="status"></div>
                <p class="mb-0">Total Leads</p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card stat-card-warning">
              <div class="card-body text-center">
                <div class="spinner-border spinner-border-sm mb-2" role="status"></div>
                <p class="mb-0">Sin Asignar</p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card stat-card-success">
              <div class="card-body text-center">
                <div class="spinner-border spinner-border-sm mb-2" role="status"></div>
                <p class="mb-0">Contactados</p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card stat-card-info">
              <div class="card-body text-center">
                <div class="spinner-border spinner-border-sm mb-2" role="status"></div>
                <p class="mb-0">Convertidos</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters Section -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <div class="row g-3">
                <div class="col-md-3">
                  <label class="form-label">Estado</label>
                  <select class="form-select" id="statusFilter">
                    <option value="">Todos los estados</option>
                    <option value="uncontacted">Sin contactar</option>
                    <option value="contacted">Contactado</option>
                    <option value="interested">Interesado</option>
                    <option value="meeting">Reunión</option>
                    <option value="won">Ganado</option>
                    <option value="lost">Perdido</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Vendedor</label>
                  <select class="form-select" id="sellerFilter">
                    <option value="">Todos los vendedores</option>
                    <option value="unassigned">Sin asignar</option>
                    <!-- Populated dynamically -->
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Provincia</label>
                  <select class="form-select" id="provinceFilter">
                    <option value="">Todas las provincias</option>
                    <!-- Populated dynamically -->
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Buscar</label>
                  <div class="input-group">
                    <input type="text" class="form-control" id="searchInput" placeholder="Nombre, email, teléfono...">
                    <button class="btn btn-outline-secondary" type="button" id="searchBtn">
                      <i class="bi bi-search"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div class="row mt-3">
                <div class="col-auto">
                  <button class="btn btn-secondary" id="clearFiltersBtn">
                    <i class="bi bi-x-circle me-1"></i>Limpiar Filtros
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      
      <!-- Leads Table -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5><i class="bi bi-list me-2"></i>Lista de Leads</h5>
              <div class="d-flex align-items-center">
                <span class="text-muted me-3" id="leadsCount">Cargando...</span>
                <div class="btn-group" role="group">
                  <button type="button" class="btn btn-outline-primary btn-sm" id="bulkAssignBtn" disabled>
                    <i class="bi bi-person-plus me-1"></i>Asignar Seleccionados
                  </button>
                  <button type="button" class="btn btn-outline-success btn-sm" id="exportBtn">
                    <i class="bi bi-download me-1"></i>Exportar
                  </button>
                </div>
              </div>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0" id="leadsTable">
                  <thead class="table-light">
                    <tr>
                      <th style="width: 40px;">
                        <input type="checkbox" class="form-check-input" id="selectAll">
                      </th>
                      <th>Establecimiento</th>
                      <th>Contacto</th>
                      <th>Teléfono</th>
                      <th>Email</th>
                      <th>Dirección</th>
                      <th>Estado</th>
                      <th>Vendedor</th>
                      <th>Rating</th>
                      <th>Última Actividad</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody id="leadsTableBody">
                    <tr>
                      <td colspan="11" class="text-center py-4">
                        <div class="spinner-border" role="status">
                          <span class="visually-hidden">Cargando leads...</span>
                        </div>
                        <p class="mt-2 mb-0 text-muted">Cargando leads...</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="card-footer">
              <nav aria-label="Leads pagination">
                <ul class="pagination pagination-sm justify-content-center mb-0" id="leadsPagination">
                  <!-- Pagination will be populated here -->
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <!-- Lead Assignment Modal -->
      <div class="modal fade" id="assignLeadModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-person-plus me-2"></i>Asignar Lead(s)
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="assignLeadForm">
                <div class="mb-3">
                  <label class="form-label">Vendedor</label>
                  <select class="form-select" id="assignSeller" required>
                    <option value="">Seleccionar vendedor...</option>
                    <!-- Populated dynamically -->
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Notas de asignación (opcional)</label>
                  <textarea class="form-control" id="assignNotes" rows="3" placeholder="Agregar notas sobre esta asignación..."></textarea>
                </div>
                <div id="selectedLeadsInfo" class="alert alert-info">
                  <!-- Selected leads info -->
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-primary" form="assignLeadForm">
                <i class="bi bi-check me-1"></i>Asignar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Lead Detail Modal -->
      <div class="modal fade" id="leadDetailModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-eye me-2"></i>Detalle del Lead
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="leadDetailContent">
              <!-- Lead details will be populated here -->
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
              <button type="button" class="btn btn-primary" id="editLeadBtn">
                <i class="bi bi-pencil me-1"></i>Editar
              </button>
            </div>
          </div>
        </div>
          <!-- Data Container with Skeleton Loading -->
          <div class="row">
            <div class="col-12">
              <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <div>
                    <h5><i class="bi bi-list-ul me-2"></i>Lista de Leads</h5>
                    <small class="text-muted" id="leadsCount">Cargando...</small>
                  </div>
                  <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" id="bulkAssignBtn" disabled>
                      <i class="bi bi-person-plus me-1"></i>Asignar Seleccionados
                    </button>
                    <button class="btn btn-sm btn-outline-success" id="exportBtn">
                      <i class="bi bi-download me-1"></i>Exportar
                    </button>
                  </div>
                </div>
                <div class="card-body p-0">
                  <div id="leadsTableContainer">
                    <!-- Skeleton loading -->
                    <div class="table-responsive">
                      <table class="table table-hover mb-0">
                        <thead class="table-light">
                          <tr>
                            <th width="50"><input type="checkbox" id="selectAll" disabled></th>
                            <th>Establecimiento</th>
                            <th>Contacto</th>
                            <th>Teléfono</th>
                            <th>Email</th>
                            <th>Estado</th>
                            <th>Vendedor</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody id="leadsTableBody">
                          ${this.generateSkeletonRows(20)}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div class="card-footer">
                  <nav aria-label="Leads pagination">
                    <ul class="pagination pagination-sm justify-content-center mb-0" id="leadsPagination">
                      <li class="page-item disabled">
                        <span class="page-link">Cargando paginación...</span>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Set HTML immediately for instant visual feedback  
      mainContent.innerHTML = leadsHTML;
      
      // Progressive data loading in background
      await this.loadLeadsDataProgressively();
      
    } catch (error) {
      console.error('❌ Error loading leads:', error);
      throw error;
    }
  }

  generateSkeletonRows(count = 20) {
    return Array(count).fill(0).map(() => `
      <tr class="skeleton-row">
        <td><div class="skeleton-checkbox"></div></td>
        <td><div class="skeleton-text skeleton-text-lg"></div></td>
        <td><div class="skeleton-text skeleton-text-md"></div></td>
        <td><div class="skeleton-text skeleton-text-sm"></div></td>
        <td><div class="skeleton-text skeleton-text-md"></div></td>
        <td><div class="skeleton-badge"></div></td>
        <td><div class="skeleton-text skeleton-text-sm"></div></td>
        <td><div class="skeleton-actions"></div></td>
      </tr>
    `).join('');
  }

  async loadLeadsDataProgressively() {
    console.log('🚀 Starting optimized progressive data loading...');
    
    try {
      // Phase 1: Batch critical requests for immediate display
      console.log('📦 Phase 1: Loading critical data (batched)');
      const criticalRequests = [
        '/leads/stats',
        '/leads?page=1&limit=50'
      ];
      
      const [statsResult, leadsResult] = await apiManager.batchRequests(criticalRequests);
      
      // Process stats
      if (statsResult.status === 'fulfilled' && statsResult.value.success) {
        this.renderLeadsStats(statsResult.value.data);
      }
      
      // Process leads
      if (leadsResult.status === 'fulfilled' && leadsResult.value.success) {
        this.renderLeadsTable(leadsResult.value.data.leads);
        this.renderPagination(leadsResult.value.data.pagination);
        this.updateLeadsCount(leadsResult.value.data.pagination.total);
      }
      
      // Setup event listeners after initial data loads
      this.setupLeadsEventListeners();
      
      // Phase 2: Background supporting data (batched)
      console.log('📦 Phase 2: Loading supporting data (background batch)');
      const supportRequests = [
        '/users/sellers',
        '/leads/provinces-with-unassigned'
      ];
      
      apiManager.batchRequests(supportRequests).then(results => {
        const [sellersResult, provincesResult] = results;
        
        // Process sellers
        if (sellersResult.status === 'fulfilled' && sellersResult.value.success) {
          this.allSellers = sellersResult.value.data.sellers || sellersResult.value.data;
          console.log('✅ Sellers loaded:', this.allSellers.length, 'sellers');
          this.populateSellerFilters();
        }
        
        // Process provinces
        if (provincesResult.status === 'fulfilled' && provincesResult.value.success) {
          this.allProvinces = provincesResult.value.data;
          console.log('✅ Provinces loaded:', this.allProvinces.length, 'provinces');
          this.populateProvinceFilter();
        }
        
        console.log('✅ Background data loaded successfully');
        
        // Phase 3: Prefetch next batch for smooth pagination
        setTimeout(() => {
          this.prefetchNextBatch().catch(error => {
            console.error('⚠️ Background prefetch error:', error);
          });
        }, 1000);
        
      }).catch(error => {
        console.error('⚠️ Background loading error:', error);
      });
      
    } catch (error) {
      console.error('❌ Progressive loading failed:', error);
      this.showLeadsError(error);
    }
  }

  async prefetchNextBatch() {
    console.log('🔄 Prefetching next batch for smooth pagination...');
    
    try {
      // Prefetch page 2 with same limit (50 records)
      const params = new URLSearchParams({
        page: 2,
        limit: 50,
        ...this.currentFilters
      });

      const response = await apiManager.get(`/leads?${params}`);
      if (response.success) {
        // Cache the results for instant loading when user clicks page 2
        this.cachedPages = this.cachedPages || new Map();
        this.cachedPages.set(2, {
          leads: response.data.leads,
          pagination: response.data.pagination,
          timestamp: Date.now()
        });
        
        console.log('✅ Next batch prefetched and cached');
      }
    } catch (error) {
      // Prefetch failures are not critical - just log them
      console.warn('⚠️ Prefetch failed, pagination will load normally:', error.message);
    }
  }

  async initializeLeadsSystem() {
    this.currentPage = 1;
    this.currentFilters = {};
    this.selectedLeads = new Set();
    this.allSellers = [];
    this.allProvinces = [];
    
    // Setup event listeners
    this.setupLeadsEventListeners();
    
    // Load initial data
    await Promise.all([
      this.loadSellers(),
      this.loadProvinces(),
      this.loadLeadsStats(),
      this.loadLeadsData()
    ]);
  }

  setupLeadsEventListeners() {
    // Filters
    const statusFilter = document.getElementById('statusFilter');
    const sellerFilter = document.getElementById('sellerFilter');
    const provinceFilter = document.getElementById('provinceFilter');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    
    [statusFilter, sellerFilter, provinceFilter].forEach(filter => {
      if (filter) {
        filter.addEventListener('change', () => this.applyFilters());
      }
    });

    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.applyFilters());
    }

    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.applyFilters();
      });
    }

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => this.clearFilters());
    }

    // Table actions
    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
      selectAll.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
    }

    const bulkAssignBtn = document.getElementById('bulkAssignBtn');
    if (bulkAssignBtn) {
      bulkAssignBtn.addEventListener('click', () => this.showBulkAssignModal());
    }

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportLeads());
    }

    // Assignment form
    const assignForm = document.getElementById('assignLeadForm');
    if (assignForm) {
      assignForm.addEventListener('submit', (e) => this.handleAssignSubmit(e));
    }
  }

  async loadSellers() {
    try {
      console.log('🔄 Loading sellers for filters...');
      const response = await apiManager.get('/users/sellers');
      
      if (response.success) {
        this.allSellers = response.data.sellers || response.data;
        console.log('✅ Sellers loaded:', this.allSellers.length, 'sellers');
        this.populateSellerFilters();
      } else {
        console.error('❌ Sellers API response not successful:', response);
      }
    } catch (error) {
      console.error('❌ Error loading sellers:', error);
    }
  }

  async loadProvinces() {
    try {
      console.log('🔄 Loading provinces for filters...');
      const response = await apiManager.get('/leads/provinces-with-unassigned');
      
      if (response.success) {
        this.allProvinces = response.data;
        console.log('✅ Provinces loaded:', this.allProvinces.length, 'provinces');
        this.populateProvinceFilter();
      } else {
        console.error('❌ Provinces API response not successful:', response);
      }
    } catch (error) {
      console.error('❌ Error loading provinces:', error);
    }
  }

  populateSellerFilters() {
    console.log('🎯 Populating seller filters...');
    const sellerFilter = document.getElementById('sellerFilter');
    const assignSeller = document.getElementById('assignSeller');
    
    if (!sellerFilter) {
      console.warn('⚠️ sellerFilter element not found');
      return;
    }
    
    if (!this.allSellers || !Array.isArray(this.allSellers)) {
      console.warn('⚠️ No sellers data available:', this.allSellers);
      return;
    }
    
    [sellerFilter, assignSeller].forEach(select => {
      if (select && this.allSellers && Array.isArray(this.allSellers)) {
        // Keep existing options, add sellers
        this.allSellers.forEach(seller => {
          const option = document.createElement('option');
          option.value = seller._id;
          option.textContent = seller.name;
          select.appendChild(option);
        });
      }
    });
    
    console.log('✅ Seller filters populated with', this.allSellers.length, 'sellers');
  }

  populateProvinceFilter() {
    console.log('🎯 Populating province filters...');
    const provinceFilter = document.getElementById('provinceFilter');
    
    if (!provinceFilter) {
      console.warn('⚠️ provinceFilter element not found');
      return;
    }
    
    if (!this.allProvinces || !Array.isArray(this.allProvinces)) {
      console.warn('⚠️ No provinces data available:', this.allProvinces);
      return;
    }
    
    this.allProvinces.forEach(province => {
      const option = document.createElement('option');
      option.value = province._id;
      option.textContent = `${province._id} (${province.count})`;
      provinceFilter.appendChild(option);
    });
    
    console.log('✅ Province filters populated with', this.allProvinces.length, 'provinces');
  }

  async loadLeadsStats() {
    try {
      const response = await apiManager.get('/leads/stats');
      if (response.success) {
        this.renderLeadsStats(response.data);
      }
    } catch (error) {
      console.error('Error loading leads stats:', error);
    }
  }

  renderLeadsStats(stats) {
    const leadsStats = document.getElementById('leadsStatsContainer');
    if (!leadsStats) return;

    const statsHTML = `
      <div class="col-md-3 col-sm-6 mb-3">
        <div class="card stat-card">
          <div class="card-body text-center">
            <h3>${stats.total}</h3>
            <p class="mb-0">Total Leads</p>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-sm-6 mb-3">
        <div class="card stat-card-warning">
          <div class="card-body text-center">
            <h3>${stats.unassigned}</h3>
            <p class="mb-0">Sin Asignar</p>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-sm-6 mb-3">
        <div class="card stat-card-success">
          <div class="card-body text-center">
            <h3>${stats.contacted}</h3>
            <p class="mb-0">Contactados</p>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-sm-6 mb-3">
        <div class="card stat-card-primary">
          <div class="card-body text-center">
            <h3>${stats.won}</h3>
            <p class="mb-0">Convertidos</p>
          </div>
        </div>
      </div>
    `;

    leadsStats.innerHTML = statsHTML;
  }

  async loadLeadsData(page = 1, limit = 25) {
    try {
      // Check cache first for instant loading
      if (this.cachedPages && this.cachedPages.has(page)) {
        const cached = this.cachedPages.get(page);
        // Use cache if less than 5 minutes old
        const cacheAge = Date.now() - cached.timestamp;
        if (cacheAge < 5 * 60 * 1000) {
          console.log(`⚡ Loading page ${page} from cache (instant)`);
          this.renderLeadsTable(cached.leads);
          this.renderPagination(cached.pagination);
          this.updateLeadsCount(cached.pagination.total);
          return;
        } else {
          // Remove expired cache
          this.cachedPages.delete(page);
        }
      }

      const params = new URLSearchParams({
        page,
        limit,
        ...this.currentFilters
      });

      const response = await apiManager.get(`/leads?${params}`);
      if (response.success) {
        this.renderLeadsTable(response.data.leads);
        this.renderPagination(response.data.pagination);
        this.updateLeadsCount(response.data.pagination.total);
        
        // Cache this page for future use
        this.cachedPages = this.cachedPages || new Map();
        this.cachedPages.set(page, {
          leads: response.data.leads,
          pagination: response.data.pagination,
          timestamp: Date.now()
        });
        
        // Prefetch next page in background if this is page 1
        if (page === 1 && response.data.pagination.totalPages > 1) {
          setTimeout(() => {
            this.prefetchNextBatch().catch(() => {}); // Silent fail
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error loading leads:', error);
      this.showErrorInTable('Error cargando leads');
    }
  }

  renderLeadsTable(leads) {
    const tableBody = document.getElementById('leadsTableBody');
    if (!tableBody) return;

    if (leads.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="11" class="text-center py-4">
            <i class="bi bi-inbox text-muted" style="font-size: 2rem;"></i>
            <p class="mt-2 mb-0 text-muted">No se encontraron leads</p>
          </td>
        </tr>
      `;
      return;
    }

    const rowsHTML = leads.map(lead => this.renderLeadRow(lead)).join('');
    tableBody.innerHTML = rowsHTML;

    // Setup individual row event listeners
    this.setupLeadRowListeners();
  }

  renderLeadRow(lead) {
    const statusBadges = {
      uncontacted: 'secondary',
      contacted: 'primary',
      interested: 'info',
      meeting: 'warning',
      won: 'success',
      lost: 'danger'
    };

    const statusTexts = {
      uncontacted: 'Sin contactar',
      contacted: 'Contactado',
      interested: 'Interesado',
      meeting: 'Reunión',
      won: 'Ganado',
      lost: 'Perdido'
    };

    const assignedSeller = this.allSellers && Array.isArray(this.allSellers) ? 
                          this.allSellers.find(s => s._id === lead.assignedTo) : null;
    const lastActivity = lead.lastContact ? new Date(lead.lastContact).toLocaleDateString() : 
                        new Date(lead.updatedAt).toLocaleDateString();

    return `
      <tr data-lead-id="${lead._id}">
        <td>
          <input type="checkbox" class="form-check-input lead-checkbox" value="${lead._id}">
        </td>
        <td>
          <div>
            <strong>${lead.name || 'N/A'}</strong>
            ${lead.type ? `<br><small class="text-muted">${lead.type}</small>` : ''}
          </div>
        </td>
        <td>${lead.contact || 'N/A'}</td>
        <td>
          ${lead.phone ? `<a href="tel:${lead.phone}" class="text-decoration-none">${lead.phone}</a>` : 'N/A'}
        </td>
        <td>
          ${lead.email ? `<a href="mailto:${lead.email}" class="text-decoration-none">${lead.email}</a>` : 'N/A'}
        </td>
        <td>
          <small>
            ${lead.address ? lead.address + '<br>' : ''}
            ${lead.city ? lead.city + ', ' : ''}${lead.province || ''}
          </small>
        </td>
        <td>
          <span class="badge bg-${statusBadges[lead.status] || 'secondary'}">
            ${statusTexts[lead.status] || lead.status}
          </span>
        </td>
        <td>
          ${assignedSeller ? 
            `<span class="badge bg-light text-dark">${assignedSeller.name}</span>` : 
            `<span class="text-muted">Sin asignar</span>`
          }
        </td>
        <td>
          ${lead.rating ? 
            `<div class="d-flex align-items-center">
              <span class="me-1">${lead.rating}</span>
              <small class="text-warning">★</small>
              ${lead.reviewCount ? `<small class="text-muted ms-1">(${lead.reviewCount})</small>` : ''}
            </div>` : 
            '<span class="text-muted">N/A</span>'
          }
        </td>
        <td>
          <small class="text-muted">${lastActivity}</small>
        </td>
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-outline-primary btn-sm view-lead-btn" data-lead-id="${lead._id}" title="Ver detalles">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-outline-success btn-sm assign-lead-btn" data-lead-id="${lead._id}" title="Asignar">
              <i class="bi bi-person-plus"></i>
            </button>
            ${lead.website ? 
              `<a href="${lead.website}" target="_blank" class="btn btn-outline-info btn-sm" title="Sitio web">
                <i class="bi bi-globe"></i>
              </a>` : ''
            }
          </div>
        </td>
      </tr>
    `;
  }

  setupLeadRowListeners() {
    // Checkbox listeners
    document.querySelectorAll('.lead-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.selectedLeads.add(e.target.value);
        } else {
          this.selectedLeads.delete(e.target.value);
        }
        this.updateBulkActionButtons();
      });
    });

    // View lead buttons
    document.querySelectorAll('.view-lead-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const leadId = e.target.closest('button').getAttribute('data-lead-id');
        this.showLeadDetail(leadId);
      });
    });

    // Assign lead buttons
    document.querySelectorAll('.assign-lead-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const leadId = e.target.closest('button').getAttribute('data-lead-id');
        this.showAssignModal([leadId]);
      });
    });
  }

  applyFilters() {
    this.currentFilters = {
      status: document.getElementById('statusFilter')?.value || '',
      assignedTo: document.getElementById('sellerFilter')?.value || '',
      province: document.getElementById('provinceFilter')?.value || '',
      search: document.getElementById('searchInput')?.value || ''
    };

    // Remove empty filters
    Object.keys(this.currentFilters).forEach(key => {
      if (!this.currentFilters[key]) {
        delete this.currentFilters[key];
      }
    });

    this.currentPage = 1;
    this.loadLeadsData(this.currentPage);
  }

  clearFilters() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('sellerFilter').value = '';
    document.getElementById('provinceFilter').value = '';
    document.getElementById('searchInput').value = '';
    
    this.currentFilters = {};
    this.currentPage = 1;
    this.loadLeadsData(this.currentPage);
  }

  toggleSelectAll(checked) {
    document.querySelectorAll('.lead-checkbox').forEach(checkbox => {
      checkbox.checked = checked;
      if (checked) {
        this.selectedLeads.add(checkbox.value);
      } else {
        this.selectedLeads.delete(checkbox.value);
      }
    });
    this.updateBulkActionButtons();
  }

  updateBulkActionButtons() {
    const bulkAssignBtn = document.getElementById('bulkAssignBtn');
    if (bulkAssignBtn) {
      bulkAssignBtn.disabled = this.selectedLeads.size === 0;
    }
  }

  showBulkAssignModal() {
    if (this.selectedLeads.size === 0) return;
    this.showAssignModal([...this.selectedLeads]);
  }

  showAssignModal(leadIds) {
    const modal = document.getElementById('assignLeadModal');
    const selectedLeadsInfo = document.getElementById('selectedLeadsInfo');
    
    if (selectedLeadsInfo) {
      selectedLeadsInfo.innerHTML = `
        <strong>Leads seleccionados:</strong> ${leadIds.length}
        <div class="mt-2">
          ${leadIds.map(id => {
            const row = document.querySelector(`tr[data-lead-id="${id}"]`);
            const name = row ? row.querySelector('strong').textContent : id;
            return `<span class="badge bg-secondary me-1">${name}</span>`;
          }).join('')}
        </div>
      `;
    }

    this.currentAssignLeads = leadIds;
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
  }

  async handleAssignSubmit(e) {
    e.preventDefault();
    
    const sellerId = document.getElementById('assignSeller').value;
    const notes = document.getElementById('assignNotes').value;
    
    if (!sellerId) {
      alert('Por favor selecciona un vendedor');
      return;
    }

    try {
      const response = await apiClient.post('/leads/assign', {
        leadIds: this.currentAssignLeads,
        sellerId: sellerId,
        assignmentType: 'manual',
        notes
      });

      if (response.success) {
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('assignLeadModal'));
        modal.hide();
        
        // Reset form
        document.getElementById('assignLeadForm').reset();
        
        // Clear selections
        this.selectedLeads.clear();
        this.updateBulkActionButtons();
        
        // Reload data
        await this.loadLeadsData(this.currentPage);
        await this.loadLeadsStats();
        
        alert('Leads asignados correctamente');
      } else {
        alert('Error asignando leads: ' + response.message);
      }
    } catch (error) {
      console.error('Error assigning leads:', error);
      alert('Error asignando leads: ' + error.message);
    }
  }

  async showLeadDetail(leadId) {
    try {
      const response = await apiClient.get(`/leads/${leadId}`);
      if (response.success) {
        this.renderLeadDetail(response.data);
        const modal = new bootstrap.Modal(document.getElementById('leadDetailModal'));
        modal.show();
      }
    } catch (error) {
      console.error('Error loading lead detail:', error);
      alert('Error cargando detalles del lead');
    }
  }

  renderLeadDetail(lead) {
    const leadDetailContent = document.getElementById('leadDetailContent');
    if (!leadDetailContent) return;

    const assignedSeller = this.allSellers && Array.isArray(this.allSellers) ? 
                          this.allSellers.find(s => s._id === lead.assignedTo) : null;
    
    leadDetailContent.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <h6 class="text-muted">INFORMACIÓN BÁSICA</h6>
          <table class="table table-sm">
            <tr><td><strong>Establecimiento:</strong></td><td>${lead.name || 'N/A'}</td></tr>
            <tr><td><strong>Contacto:</strong></td><td>${lead.contact || 'N/A'}</td></tr>
            <tr><td><strong>Teléfono:</strong></td><td>${lead.phone || 'N/A'}</td></tr>
            <tr><td><strong>Email:</strong></td><td>${lead.email || 'N/A'}</td></tr>
            <tr><td><strong>Sitio web:</strong></td><td>
              ${lead.website ? `<a href="${lead.website}" target="_blank">${lead.website}</a>` : 'N/A'}
            </td></tr>
            <tr><td><strong>Tipo:</strong></td><td>${lead.type || 'N/A'}</td></tr>
          </table>
        </div>
        <div class="col-md-6">
          <h6 class="text-muted">UBICACIÓN</h6>
          <table class="table table-sm">
            <tr><td><strong>Dirección:</strong></td><td>${lead.address || 'N/A'}</td></tr>
            <tr><td><strong>Ciudad:</strong></td><td>${lead.city || 'N/A'}</td></tr>
            <tr><td><strong>Provincia:</strong></td><td>${lead.province || 'N/A'}</td></tr>
          </table>
          
          <h6 class="text-muted mt-3">VALORACIÓN</h6>
          <table class="table table-sm">
            <tr><td><strong>Rating:</strong></td><td>
              ${lead.rating ? `${lead.rating} ★` : 'N/A'}
              ${lead.reviewCount ? ` (${lead.reviewCount} reseñas)` : ''}
            </td></tr>
            <tr><td><strong>Horarios:</strong></td><td>${lead.schedule || 'N/A'}</td></tr>
          </table>
        </div>
      </div>
      
      <div class="row mt-3">
        <div class="col-12">
          <h6 class="text-muted">GESTIÓN DE VENTAS</h6>
          <table class="table table-sm">
            <tr><td><strong>Estado:</strong></td><td>
              <span class="badge bg-primary">${lead.status}</span>
            </td></tr>
            <tr><td><strong>Vendedor asignado:</strong></td><td>
              ${assignedSeller ? assignedSeller.name : 'Sin asignar'}
            </td></tr>
            <tr><td><strong>Fecha de asignación:</strong></td><td>
              ${lead.assignedAt ? new Date(lead.assignedAt).toLocaleString() : 'N/A'}
            </td></tr>
            <tr><td><strong>Último contacto:</strong></td><td>
              ${lead.lastContact ? new Date(lead.lastContact).toLocaleString() : 'N/A'}
            </td></tr>
            <tr><td><strong>Próxima acción:</strong></td><td>
              ${lead.nextAction ? new Date(lead.nextAction).toLocaleString() : 'N/A'}
            </td></tr>
          </table>
        </div>
      </div>
      
      ${lead.notes ? `
        <div class="row mt-3">
          <div class="col-12">
            <h6 class="text-muted">NOTAS</h6>
            <div class="alert alert-light">
              ${lead.notes.replace(/\n/g, '<br>')}
            </div>
          </div>
        </div>
      ` : ''}
      
      <div class="row mt-3">
        <div class="col-12">
          <h6 class="text-muted">HISTORIAL DE CAMBIOS</h6>
          <div class="timeline">
            ${lead.statusHistory && lead.statusHistory.length > 0 ? 
              lead.statusHistory.map(change => `
                <div class="timeline-item">
                  <small class="text-muted">${new Date(change.changedAt).toLocaleString()}</small><br>
                  <strong>Estado cambiado a:</strong> ${change.status}
                  ${change.note ? `<br><em>${change.note}</em>` : ''}
                </div>
              `).join('') : 
              '<p class="text-muted">No hay cambios registrados</p>'
            }
          </div>
        </div>
      </div>
    `;
  }

  renderPagination(pagination) {
    const paginationContainer = document.getElementById('leadsPagination');
    if (!paginationContainer) return;

    const { page, pages, total } = pagination;
    let paginationHTML = '';

    // Previous button
    paginationHTML += `
      <li class="page-item ${page === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${page - 1}">Anterior</a>
      </li>
    `;

    // Page numbers
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(pages, page + 2);

    if (startPage > 1) {
      paginationHTML += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
      if (startPage > 2) {
        paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <li class="page-item ${i === page ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `;
    }

    if (endPage < pages) {
      if (endPage < pages - 1) {
        paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
      paginationHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${pages}">${pages}</a></li>`;
    }

    // Next button
    paginationHTML += `
      <li class="page-item ${page === pages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${page + 1}">Siguiente</a>
      </li>
    `;

    paginationContainer.innerHTML = paginationHTML;

    // Add click listeners
    paginationContainer.querySelectorAll('a.page-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const newPage = parseInt(e.target.getAttribute('data-page'));
        if (newPage && newPage !== this.currentPage) {
          this.currentPage = newPage;
          this.loadLeadsData(this.currentPage);
        }
      });
    });
  }

  updateLeadsCount(total) {
    const leadsCount = document.getElementById('leadsCount');
    if (leadsCount) {
      leadsCount.textContent = `${total} leads`;
    }
  }

  showErrorInTable(message) {
    const tableBody = document.getElementById('leadsTableBody');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="11" class="text-center py-4 text-danger">
            <i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i>
            <p class="mt-2 mb-0">${message}</p>
          </td>
        </tr>
      `;
    }
  }

  async exportLeads() {
    try {
      const params = new URLSearchParams(this.currentFilters);
      const response = await fetch(`${apiClient.baseURL}/leads/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${authManager.getToken()}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Error exportando leads');
      }
    } catch (error) {
      console.error('Error exporting leads:', error);
      alert('Error exportando leads');
    }
  }

  loadImportContent() {
    console.log('📥 Loading advanced import content...');
    const user = authManager.getCurrentUser();
    if (!user) return;

    const importHTML = `
      <div class="row">
        <div class="col-12">
          <h2><i class="bi bi-upload me-2"></i>Importar Leads</h2>
          <p class="text-muted">Sistema avanzado de importación masiva con preview y mapeo de columnas</p>
        </div>
      </div>
      
      <!-- Tabs for different import stages -->
      <ul class="nav nav-tabs mt-4" id="importTabs" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" id="upload-tab" data-bs-toggle="tab" data-bs-target="#upload" type="button">
            <i class="bi bi-upload me-1"></i>1. Cargar Archivo
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link disabled" id="preview-tab" data-bs-toggle="tab" data-bs-target="#preview" type="button">
            <i class="bi bi-eye me-1"></i>2. Preview y Mapeo
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link disabled" id="process-tab" data-bs-toggle="tab" data-bs-target="#process" type="button">
            <i class="bi bi-gear me-1"></i>3. Procesar
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="history-tab" data-bs-toggle="tab" data-bs-target="#history" type="button">
            <i class="bi bi-clock-history me-1"></i>Historial
          </button>
        </li>
      </ul>
      
      <div class="tab-content mt-3" id="importTabContent">
        <!-- Upload Tab -->
        <div class="tab-pane fade show active" id="upload" role="tabpanel">
          <div class="row">
            <div class="col-md-8">
              <div class="card">
                <div class="card-body">
                  <form id="csvUploadForm" enctype="multipart/form-data">
                    <div class="mb-4">
                      <label for="csvFileInput" class="form-label">
                        <i class="bi bi-file-earmark-spreadsheet me-2"></i>Seleccionar archivo CSV
                      </label>
                      <input type="file" class="form-control form-control-lg" id="csvFileInput" accept=".csv" required>
                      <div class="form-text">
                        Formatos soportados: CSV (.csv) - Máximo 10MB
                      </div>
                    </div>
                    <button type="submit" class="btn btn-primary btn-lg">
                      <i class="bi bi-upload me-2"></i>Cargar y Previsualizar
                    </button>
                  </form>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card">
                <div class="card-header">
                  <h6><i class="bi bi-info-circle me-2"></i>Guía de Formato</h6>
                </div>
                <div class="card-body">
                  <p class="small mb-2"><strong>Campos disponibles:</strong></p>
                  <ul class="small">
                    <li><strong>name*</strong> - Nombre del establecimiento</li>
                    <li>contact - Persona de contacto</li>
                    <li>phone - Teléfono</li>
                    <li>email - Email</li>
                    <li>address - Dirección</li>
                    <li>province - Provincia</li>
                    <li>city - Ciudad</li>
                    <li>website - Sitio web</li>
                    <li>type - Tipo de negocio</li>
                    <li>rating - Calificación (1-5)</li>
                    <li>reviewCount - Número de reseñas</li>
                  </ul>
                  <small class="text-muted">* Campo obligatorio</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Preview Tab -->
        <div class="tab-pane fade" id="preview" role="tabpanel">
          <div id="previewContent">
            <!-- Content loaded dynamically -->
          </div>
        </div>
        
        <!-- Process Tab -->
        <div class="tab-pane fade" id="process" role="tabpanel">
          <div id="processContent">
            <!-- Content loaded dynamically -->
          </div>
        </div>
        
        <!-- History Tab -->
        <div class="tab-pane fade" id="history" role="tabpanel">
          <div id="historyContent">
            <div class="text-center py-4">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Cargando historial...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Progress modal -->
      <div class="modal fade" id="importProgressModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-arrow-repeat me-2"></i>Procesando Importación
              </h5>
            </div>
            <div class="modal-body text-center">
              <div class="spinner-border mb-3" role="status"></div>
              <p id="progressMessage">Procesando archivo...</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
      mainContent.innerHTML = importHTML;
    }
    
    // Initialize import functionality
    this.initializeImportSystem();
  }

  initializeImportSystem() {
    this.currentUploadData = null;
    this.columnMapping = {};
    
    // Set up upload form
    const uploadForm = document.getElementById('csvUploadForm');
    if (uploadForm) {
      uploadForm.addEventListener('submit', (e) => this.handleFileUpload(e));
    }
    
    // Load import history when tab is shown
    const historyTab = document.getElementById('history-tab');
    if (historyTab) {
      historyTab.addEventListener('shown.bs.tab', () => this.loadImportHistory());
    }
  }

  async handleFileUpload(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
      alert('Por favor selecciona un archivo CSV');
      return;
    }
    
    const formData = new FormData();
    formData.append('csvFile', file);
    
    try {
      // Show loading in button
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<div class="spinner-border spinner-border-sm me-2"></div>Cargando...';
      submitBtn.disabled = true;
      
      const response = await apiClient.uploadFile('/import/upload', formData);
      
      if (response.success) {
        this.currentUploadData = response.data;
        this.showPreviewTab();
      } else {
        alert('Error cargando archivo: ' + response.message);
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error cargando archivo: ' + error.message);
    }
  }

  showPreviewTab() {
    // Enable and switch to preview tab
    const previewTab = document.getElementById('preview-tab');
    previewTab.classList.remove('disabled');
    
    // Show the preview content
    this.renderPreviewContent();
    
    // Switch to preview tab
    const previewTabTrigger = new bootstrap.Tab(previewTab);
    previewTabTrigger.show();
  }

  renderPreviewContent() {
    const previewContent = document.getElementById('previewContent');
    if (!this.currentUploadData) return;
    
    const { headers, rows, pagination, stats } = this.currentUploadData;
    
    const previewHTML = `
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5>
              <i class="bi bi-eye me-2"></i>Preview del Archivo
              <span class="badge bg-primary ms-2">${stats.totalRows} filas</span>
            </h5>
            <button class="btn btn-outline-secondary" onclick="window.crmApp.goBackToUpload()">
              <i class="bi bi-arrow-left me-1"></i>Cambiar archivo
            </button>
          </div>
        </div>
      </div>
      
      <div class="row">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header">
              <h6><i class="bi bi-table me-2"></i>Datos del CSV</h6>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-sm table-bordered">
                  <thead class="table-light">
                    <tr>
                      ${headers.map((header, index) => `<th class="text-nowrap">Col ${index + 1}: ${header || 'Sin encabezado'}</th>`).join('')}
                    </tr>
                  </thead>
                  <tbody>
                    ${rows.map((row, rowIndex) => `
                      <tr>
                        ${row.map(cell => `<td class="text-nowrap" title="${cell || ''}">${(cell || '').substring(0, 30)}${(cell || '').length > 30 ? '...' : ''}</td>`).join('')}
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              ${pagination.totalRows > 5 ? `
                <div class="text-center mt-2">
                  <small class="text-muted">Mostrando las primeras 5 filas de ${pagination.totalRows} total</small>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
        
        <div class="col-md-4">
          <div class="card">
            <div class="card-header">
              <h6><i class="bi bi-arrow-left-right me-2"></i>Mapeo de Columnas</h6>
            </div>
            <div class="card-body">
              <form id="columnMappingForm">
                <div class="mb-3">
                  <small class="text-muted">Selecciona qué columna del CSV corresponde a cada campo:</small>
                </div>
                
                ${this.generateColumnMappingFields(headers)}
                
                <div class="mt-4">
                  <button type="submit" class="btn btn-success w-100">
                    <i class="bi bi-arrow-right me-2"></i>Procesar Importación
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
    
    previewContent.innerHTML = previewHTML;
    
    // Set up column mapping form
    const mappingForm = document.getElementById('columnMappingForm');
    if (mappingForm) {
      mappingForm.addEventListener('submit', (e) => this.handleColumnMapping(e));
    }
  }

  generateColumnMappingFields(headers) {
    const leadFields = [
      { key: 'name', label: 'Nombre *', required: true },
      { key: 'contact', label: 'Contacto' },
      { key: 'phone', label: 'Teléfono' },
      { key: 'email', label: 'Email' },
      { key: 'address', label: 'Dirección' },
      { key: 'province', label: 'Provincia' },
      { key: 'city', label: 'Ciudad' },
      { key: 'website', label: 'Sitio Web' },
      { key: 'type', label: 'Tipo' },
      { key: 'rating', label: 'Calificación' },
      { key: 'reviewCount', label: 'Reseñas' }
    ];
    
    return leadFields.map(field => `
      <div class="mb-2">
        <label class="form-label small">${field.label}</label>
        <select class="form-select form-select-sm" name="${field.key}" ${field.required ? 'required' : ''}>
          <option value="">-- No mapear --</option>
          ${headers.map((header, index) => `
            <option value="${index}">Col ${index + 1}: ${header || 'Sin nombre'}</option>
          `).join('')}
        </select>
      </div>
    `).join('');
  }

  async handleColumnMapping(e) {
    e.preventDefault();
    
    // Collect column mapping
    const formData = new FormData(e.target);
    const columnMapping = {};
    
    for (const [field, columnIndex] of formData.entries()) {
      if (columnIndex !== '') {
        columnMapping[field] = parseInt(columnIndex);
      }
    }
    
    // Validate that name is mapped (required field)
    if (!columnMapping.name && columnMapping.name !== 0) {
      alert('El campo "Nombre" es obligatorio. Por favor mapea una columna para el nombre.');
      return;
    }
    
    // Show progress modal
    const progressModal = new bootstrap.Modal(document.getElementById('importProgressModal'));
    progressModal.show();
    
    try {
      // Process the import
      const processData = {
        filename: this.currentUploadData.filename,
        originalName: this.currentUploadData.originalName,
        columnMapping,
        skipDuplicates: true
      };
      
      const response = await apiClient.post('/import/process', processData);
      
      if (response.success) {
        progressModal.hide();
        this.showImportResults(response.data);
      } else {
        progressModal.hide();
        alert('Error procesando importación: ' + response.message);
      }
      
    } catch (error) {
      progressModal.hide();
      console.error('Import process error:', error);
      alert('Error procesando importación: ' + error.message);
    }
  }

  showImportResults(results) {
    const { stats, errors } = results;
    
    const resultHTML = `
      <div class="row">
        <div class="col-12">
          <div class="alert alert-success">
            <h5 class="alert-heading">
              <i class="bi bi-check-circle me-2"></i>Importación Completada
            </h5>
            <hr>
            <div class="row text-center">
              <div class="col-md-3">
                <div class="h4 text-success">${stats.leadsCreated}</div>
                <small>Leads Creados</small>
              </div>
              <div class="col-md-3">
                <div class="h4 text-warning">${stats.duplicatesRemoved}</div>
                <small>Duplicados</small>
              </div>
              <div class="col-md-3">
                <div class="h4 text-danger">${stats.invalidRemoved}</div>
                <small>Inválidos</small>
              </div>
              <div class="col-md-3">
                <div class="h4 text-info">${stats.totalRows}</div>
                <small>Total Procesadas</small>
              </div>
            </div>
          </div>
          
          <div class="text-center">
            <button class="btn btn-primary me-2" onclick="window.crmApp.loadLeadsContent()">
              <i class="bi bi-person-lines-fill me-2"></i>Ver Leads
            </button>
            <button class="btn btn-outline-secondary" onclick="window.crmApp.resetImport()">
              <i class="bi bi-arrow-counterclockwise me-2"></i>Nueva Importación
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('previewContent').innerHTML = resultHTML;
  }

  async loadImportHistory() {
    const historyContent = document.getElementById('historyContent');
    
    try {
      const response = await apiClient.get('/import/history');
      
      if (response.success) {
        this.renderImportHistory(response.data);
      } else {
        historyContent.innerHTML = '<div class="alert alert-danger">Error cargando historial</div>';
      }
      
    } catch (error) {
      historyContent.innerHTML = '<div class="alert alert-danger">Error cargando historial</div>';
    }
  }

  renderImportHistory(data) {
    const historyContent = document.getElementById('historyContent');
    const { imports } = data;
    
    if (imports.length === 0) {
      historyContent.innerHTML = `
        <div class="text-center py-4">
          <i class="bi bi-inbox display-4 text-muted"></i>
          <p class="text-muted mt-2">No hay importaciones registradas</p>
        </div>
      `;
      return;
    }
    
    const historyHTML = `
      <div class="row">
        ${imports.map(importRecord => `
          <div class="col-md-6 mb-3">
            <div class="card">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 class="card-title">${importRecord.originalName}</h6>
                    <small class="text-muted">
                      ${new Date(importRecord.uploadedAt).toLocaleString()}
                    </small>
                  </div>
                  <span class="badge bg-${importRecord.status === 'completed' ? 'success' : importRecord.status === 'failed' ? 'danger' : 'warning'}">
                    ${importRecord.status}
                  </span>
                </div>
                
                ${importRecord.stats ? `
                  <div class="row mt-3 text-center">
                    <div class="col-3">
                      <div class="text-success fw-bold">${importRecord.stats.leadsCreated}</div>
                      <small>Creados</small>
                    </div>
                    <div class="col-3">
                      <div class="text-warning fw-bold">${importRecord.stats.duplicatesRemoved}</div>
                      <small>Duplicados</small>
                    </div>
                    <div class="col-3">
                      <div class="text-danger fw-bold">${importRecord.stats.invalidRemoved}</div>
                      <small>Inválidos</small>
                    </div>
                    <div class="col-3">
                      <div class="text-info fw-bold">${importRecord.stats.totalRows}</div>
                      <small>Total</small>
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    historyContent.innerHTML = historyHTML;
  }

  goBackToUpload() {
    const uploadTab = document.getElementById('upload-tab');
    const uploadTabTrigger = new bootstrap.Tab(uploadTab);
    uploadTabTrigger.show();
    
    // Reset preview tab
    const previewTab = document.getElementById('preview-tab');
    previewTab.classList.add('disabled');
    
    // Reset form
    document.getElementById('csvUploadForm').reset();
    this.currentUploadData = null;
  }

  resetImport() {
    this.goBackToUpload();
    document.getElementById('previewContent').innerHTML = '';
  }

  // UI Helper Methods
  showLoading() {
    this.isLoading = true;
    if (this.loadingSpinner) {
      this.loadingSpinner.classList.add('d-flex');
      this.loadingSpinner.classList.remove('d-none');
      this.loadingSpinner.style.display = 'flex';
      console.log('🔄 Loading spinner shown');
      
      // Safety timeout - force hide after 10 seconds
      if (this.loadingTimeout) {
        clearTimeout(this.loadingTimeout);
      }
      this.loadingTimeout = setTimeout(() => {
        if (this.isLoading) {
          console.log('⏰ Loading timeout reached - force hiding spinner');
          this.forceHideLoading();
        }
      }, 10000);
    }
  }

  hideLoading() {
    this.isLoading = false;
    console.log('🔄 Hiding loading spinner...');
    
    if (this.loadingSpinner) {
      this.loadingSpinner.classList.remove('d-flex');
      this.loadingSpinner.classList.add('d-none');
      this.loadingSpinner.style.display = 'none';
      console.log('✅ Loading spinner hidden');
    } else {
      console.error('❌ Loading spinner element not found');
    }
    
    // Clear any existing timeout to prevent multiple calls
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
  }

  // Force hide loading spinner after timeout (emergency fallback)
  forceHideLoading() {
    console.log('🚨 Force hiding loading spinner (timeout fallback)');
    this.hideLoading();
  }

  showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }
  }

  hideLoginError() {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }

  showError(message) {
    this.showToast('Error', message, 'danger');
  }

  showToast(title, message, type = 'info') {
    const toast = document.getElementById('alertToast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');

    if (toast && toastTitle && toastMessage) {
      toastTitle.textContent = title;
      toastMessage.textContent = message;
      
      // Remove existing classes and add new one
      toast.className = `toast text-bg-${type}`;
      
      const bsToast = new bootstrap.Toast(toast);
      bsToast.show();
    }
  }

  async loadSellersContent() {
    console.log('👥 Loading sellers management content...');
    const user = authManager.getCurrentUser();
    if (!user || user.role !== 'admin') return;
    
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    try {
      // Show loading
      mainContent.innerHTML = '<div class="text-center py-5"><div class="spinner-border" role="status"></div></div>';

      // Load sellers data
      const sellersResponse = await apiClient.get('/users/sellers');
      const statsResponse = await apiClient.get('/users/stats/dashboard');
      const provincesResponse = await apiClient.get('/leads/provinces-with-unassigned');

      if (!sellersResponse.success || !statsResponse.success) {
        throw new Error('Error loading seller data');
      }

      const sellers = sellersResponse.data.sellers || [];
      const stats = statsResponse.data;
      const provincesData = provincesResponse.success ? provincesResponse.data : [];
      const provinces = Array.isArray(provincesData) ? provincesData : [];

      const sellersHTML = `
        <div class="seller-management">
          <!-- Header -->
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2><i class="bi bi-people me-2"></i>Gestión de Vendedores</h2>
              <p class="text-muted">Administrar vendedores, asignar leads y ver estadísticas</p>
            </div>
            <button class="btn btn-success" onclick="window.crmApp.showCreateSellerModal()">
              <i class="bi bi-person-plus me-1"></i>Nuevo Vendedor
            </button>
          </div>

          <!-- Statistics Overview -->
          <div class="row mb-4">
            <div class="col-md-3">
              <div class="card stat-card-primary">
                <div class="card-body text-center">
                  <h3>${stats.overview.totalSellers || 0}</h3>
                  <p class="mb-0">Total Vendedores</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card stat-card-success">
                <div class="card-body text-center">
                  <h3>${stats.overview.activeSellers || 0}</h3>
                  <p class="mb-0">Vendedores Activos</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card stat-card-warning">
                <div class="card-body text-center">
                  <h3>${stats.overview.totalLeads || 0}</h3>
                  <p class="mb-0">Total Leads</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card stat-card-info">
                <div class="card-body text-center">
                  <h3>${stats.overview.unassignedLeads || 0}</h3>
                  <p class="mb-0">Sin Asignar</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Lead Assignment Section -->
          <div class="card mb-4">
            <div class="card-header">
              <div class="d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="bi bi-distribute-horizontal me-1"></i>Asignación de Leads</h5>
                <button class="btn btn-primary btn-sm" onclick="window.crmApp.showLeadAssignmentModal()">
                  <i class="bi bi-plus-circle me-1"></i>Asignar Leads
                </button>
              </div>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-4">
                  <label class="form-label">Filtrar por Provincia</label>
                  <select class="form-select" id="assignProvinceFilter">
                    <option value="">Todas las provincias</option>
                    ${provinces.map(p => `<option value="${p._id}">${p._id} (${p.count} leads)</option>`).join('')}
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Cantidad por Vendedor</label>
                  <input type="number" class="form-control" id="assignQuantity" value="10" min="1" max="1000">
                </div>
                <div class="col-md-3">
                  <label class="form-label">Tipo de Asignación</label>
                  <select class="form-select" id="assignmentType">
                    <option value="unassigned">Solo No Asignados</option>
                    <option value="reassign">Permitir Reasignación</option>
                  </select>
                </div>
                <div class="col-md-2 d-flex align-items-end">
                  <button class="btn btn-success w-100" onclick="window.crmApp.executeLeadAssignment()">
                    <i class="bi bi-check-circle me-1"></i>Asignar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Sellers Grid -->
          <div class="row">
            ${sellers.map(seller => {
              const lastAccess = seller.lastAccess 
                ? new Date(seller.lastAccess).toLocaleDateString('es-ES', { 
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })
                : 'Nunca';
              
              const isOnline = seller.lastAccess && 
                (new Date() - new Date(seller.lastAccess)) < 15 * 60 * 1000; // 15 minutes

              return `
                <div class="col-md-6 col-lg-4 mb-4">
                  <div class="card h-100 seller-card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                      <div>
                        <h6 class="mb-0">${seller.name}</h6>
                        <small class="text-muted">@${seller.username}</small>
                      </div>
                      <div class="d-flex align-items-center">
                        <span class="badge ${isOnline ? 'bg-success' : 'bg-secondary'} me-2">
                          ${isOnline ? 'En Línea' : 'Offline'}
                        </span>
                        <div class="dropdown">
                          <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                            <i class="bi bi-three-dots"></i>
                          </button>
                          <ul class="dropdown-menu">
                            <li><a class="dropdown-item" onclick="window.crmApp.showSellerDetails('${seller._id}')">Ver Detalles</a></li>
                            <li><a class="dropdown-item" onclick="window.crmApp.showSellerConfig('${seller._id}')">Configurar</a></li>
                            <li><a class="dropdown-item" onclick="window.crmApp.showSellerLeads('${seller._id}')">Ver Leads</a></li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div class="card-body">
                      <div class="row text-center">
                        <div class="col-6">
                          <div class="h4 text-primary">${seller.totalLeads || 0}</div>
                          <small>Leads Asignados</small>
                        </div>
                        <div class="col-6">
                          <div class="h4 text-success">${seller.totalContacted || 0}</div>
                          <small>Contactados</small>
                        </div>
                      </div>
                      <hr>
                      <div class="text-center">
                        <small class="text-muted">Último acceso: ${lastAccess}</small>
                      </div>
                    </div>
                    <div class="card-footer">
                      <div class="d-grid gap-2 d-md-flex justify-content-md-center">
                        <button class="btn btn-primary btn-sm" onclick="window.crmApp.assignLeadsToSeller('${seller._id}')">
                          <i class="bi bi-plus-circle me-1"></i>Asignar Leads
                        </button>
                        <button class="btn btn-info btn-sm" onclick="window.crmApp.showSellerAnalytics('${seller._id}')">
                          <i class="bi bi-graph-up me-1"></i>Analytics
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Lead Assignment Modal -->
        <div class="modal fade" id="leadAssignmentModal" tabindex="-1">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Asignación Avanzada de Leads</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body" id="leadAssignmentContent">
                <!-- Content will be loaded dynamically -->
              </div>
            </div>
          </div>
        </div>

        <!-- Seller Details Modal -->
        <div class="modal fade" id="sellerDetailsModal" tabindex="-1">
          <div class="modal-dialog modal-xl">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Detalles del Vendedor</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body" id="sellerDetailsContent">
                <!-- Content will be loaded dynamically -->
              </div>
            </div>
          </div>
        </div>
      `;

      mainContent.innerHTML = sellersHTML;

    } catch (error) {
      console.error('Error loading sellers content:', error);
      mainContent.innerHTML = `
        <div class="alert alert-danger">
          <h4>Error</h4>
          <p>No se pudo cargar la información de vendedores: ${error.message}</p>
          <button class="btn btn-primary" onclick="this.loadSellersContent()">Reintentar</button>
        </div>
      `;
    }
  }

  async executeLeadAssignment() {
    try {
      const province = document.getElementById('assignProvinceFilter').value;
      const quantity = parseInt(document.getElementById('assignQuantity').value);
      const assignmentType = document.getElementById('assignmentType').value;

      if (!quantity || quantity < 1) {
        alert('Por favor ingrese una cantidad válida');
        return;
      }

      // Get active sellers
      const sellersResponse = await apiClient.get('/users/sellers');
      if (!sellersResponse.success) {
        throw new Error('Error obteniendo vendedores');
      }

      const sellers = sellersResponse.data.sellers;
      if (sellers.length === 0) {
        alert('No hay vendedores disponibles');
        return;
      }

      // Confirm assignment
      const provinceText = province ? ` de la provincia ${province}` : '';
      const typeText = assignmentType === 'reassign' ? 'permitiendo reasignación' : 'solo no asignados';
      const message = `¿Asignar ${quantity} leads${provinceText} a cada uno de los ${sellers.length} vendedores (${typeText})?`;
      
      if (!confirm(message)) return;

      // Show progress
      const progressHTML = `
        <div class="alert alert-info">
          <div class="d-flex align-items-center">
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            <span>Asignando leads... Por favor espere</span>
          </div>
        </div>
      `;
      
      // Find assignment section and show progress
      const assignmentCard = document.querySelector('.card-body');
      const originalHTML = assignmentCard.innerHTML;
      assignmentCard.innerHTML = progressHTML;

      // Execute assignments for each seller
      let totalAssigned = 0;
      let errors = [];

      for (const seller of sellers) {
        try {
          // Build request
          const assignmentData = {
            sellerIds: [seller._id],
            quantity: quantity,
            strategy: 'quantity'
          };

          if (province) {
            assignmentData.filters = { province: province };
          }
          
          if (assignmentType === 'unassigned') {
            assignmentData.onlyUnassigned = true;
          }

          const response = await apiClient.post('/leads/bulk-assign', assignmentData);
          
          if (response.success) {
            totalAssigned += response.data.assigned || 0;
          } else {
            errors.push(`${seller.name}: ${response.message}`);
          }
        } catch (error) {
          errors.push(`${seller.name}: ${error.message}`);
        }
      }

      // Restore original content
      assignmentCard.innerHTML = originalHTML;

      // Show results
      if (totalAssigned > 0) {
        this.showToast('Éxito', `Se asignaron ${totalAssigned} leads correctamente`, 'success');
        // Reload content to show updated numbers
        setTimeout(() => this.loadSellersContent(), 1000);
      }

      if (errors.length > 0) {
        console.error('Assignment errors:', errors);
        alert(`Algunos errores durante la asignación:\n${errors.join('\n')}`);
      }

    } catch (error) {
      console.error('Error in lead assignment:', error);
      alert('Error durante la asignación: ' + error.message);
    }
  }

  async assignLeadsToSeller(sellerId) {
    try {
      const quantity = prompt('¿Cuántos leads desea asignar a este vendedor?', '10');
      if (!quantity || isNaN(quantity) || quantity < 1) return;

      const assignmentData = {
        sellerIds: [sellerId],
        quantity: parseInt(quantity),
        strategy: 'quantity',
        onlyUnassigned: true
      };

      const response = await apiClient.post('/leads/bulk-assign', assignmentData);
      
      if (response.success) {
        this.showToast('Éxito', `Se asignaron ${response.data.assigned} leads correctamente`, 'success');
        setTimeout(() => this.loadSellersContent(), 1000);
      } else {
        alert('Error: ' + response.message);
      }

    } catch (error) {
      console.error('Error assigning leads to seller:', error);
      alert('Error asignando leads: ' + error.message);
    }
  }

  async showSellerAnalytics(sellerId) {
    try {
      const modal = new bootstrap.Modal(document.getElementById('sellerDetailsModal'));
      const content = document.getElementById('sellerDetailsContent');
      
      // Show loading
      content.innerHTML = '<div class="text-center py-4"><div class="spinner-border"></div></div>';
      modal.show();

      // Load seller data and analytics
      const [sellerResponse, timelineResponse, detailedLeadsResponse] = await Promise.all([
        apiClient.get(`/users/${sellerId}`),
        apiClient.get(`/users/${sellerId}/timeline-stats?period=month`),
        apiClient.get(`/users/${sellerId}/detailed-leads?limit=10`)
      ]);

      if (!sellerResponse.success || !timelineResponse.success) {
        throw new Error('Error loading seller data');
      }

      const seller = sellerResponse.data.user;
      const timeline = timelineResponse.data;
      const detailedLeads = detailedLeadsResponse.success ? detailedLeadsResponse.data : null;

      const analyticsHTML = `
        <div class="seller-analytics">
          <!-- Seller Header -->
          <div class="row mb-4">
            <div class="col-md-8">
              <h4>${seller.name}</h4>
              <p class="text-muted">@${seller.username} • ${seller.email}</p>
              <p><strong>Estado:</strong> <span class="badge ${seller.isActive ? 'bg-success' : 'bg-danger'}">${seller.isActive ? 'Activo' : 'Inactivo'}</span></p>
            </div>
            <div class="col-md-4 text-end">
              <button class="btn btn-outline-primary btn-sm me-2" onclick="window.crmApp.showSellerConfig('${seller._id}')">
                <i class="bi bi-gear me-1"></i>Configurar
              </button>
              <button class="btn btn-outline-info btn-sm" onclick="window.crmApp.showSellerLeads('${seller._id}')">
                <i class="bi bi-list me-1"></i>Ver Todos los Leads
              </button>
            </div>
          </div>

          <!-- Statistics Cards -->
          <div class="row mb-4">
            <div class="col-md-3">
              <div class="card text-center">
                <div class="card-body">
                  <h3 class="text-primary">${seller.totalLeads || 0}</h3>
                  <small>Total Leads</small>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card text-center">
                <div class="card-body">
                  <h3 class="text-success">${seller.totalContacted || 0}</h3>
                  <small>Contactados</small>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card text-center">
                <div class="card-body">
                  <h3 class="text-info">${timeline.statusBreakdown.won || 0}</h3>
                  <small>Convertidos</small>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card text-center">
                <div class="card-body">
                  <h3 class="text-warning">${seller.totalLeads ? ((timeline.statusBreakdown.won || 0) / seller.totalLeads * 100).toFixed(1) : 0}%</h3>
                  <small>Tasa Conversión</small>
                </div>
              </div>
            </div>
          </div>

          <!-- Timeline Stats -->
          <div class="row mb-4">
            <div class="col-12">
              <div class="card">
                <div class="card-header">
                  <h5>Estadísticas del Último Mes</h5>
                </div>
                <div class="card-body">
                  ${timeline.timelineStats && timeline.timelineStats.length > 0 ? `
                    <div class="row">
                      <div class="col-md-4">
                        <h6>Leads por Status</h6>
                        <ul class="list-unstyled">
                          ${Object.entries(timeline.statusBreakdown).map(([status, count]) => 
                            `<li><span class="badge bg-secondary me-2">${count}</span>${status}</li>`
                          ).join('')}
                        </ul>
                      </div>
                      <div class="col-md-8">
                        <h6>Actividad Timeline</h6>
                        <div class="table-responsive">
                          <table class="table table-sm">
                            <thead>
                              <tr>
                                <th>Fecha</th>
                                <th>Asignados</th>
                                <th>Contactados</th>
                                <th>Convertidos</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${timeline.timelineStats.slice(-10).map(stat => `
                                <tr>
                                  <td>${new Date(stat._id).toLocaleDateString('es-ES')}</td>
                                  <td>${stat.assigned}</td>
                                  <td>${stat.contacted}</td>
                                  <td>${stat.converted}</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ` : '<p class="text-muted">No hay datos de actividad reciente</p>'}
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          ${timeline.recentActivity && timeline.recentActivity.length > 0 ? `
            <div class="row">
              <div class="col-12">
                <div class="card">
                  <div class="card-header">
                    <h5>Actividad Reciente</h5>
                  </div>
                  <div class="card-body">
                    <div class="list-group list-group-flush">
                      ${timeline.recentActivity.map(lead => `
                        <div class="list-group-item">
                          <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1">${lead.name}</h6>
                            <small>${new Date(lead.lastContact).toLocaleDateString('es-ES')}</small>
                          </div>
                          <p class="mb-1"><strong>Estado:</strong> ${lead.status}</p>
                          ${lead.notes ? `<small>${lead.notes}</small>` : ''}
                        </div>
                      `).join('')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      `;

      content.innerHTML = analyticsHTML;

    } catch (error) {
      console.error('Error loading seller analytics:', error);
      document.getElementById('sellerDetailsContent').innerHTML = `
        <div class="alert alert-danger">
          <h4>Error</h4>
          <p>No se pudieron cargar las estadísticas del vendedor: ${error.message}</p>
        </div>
      `;
    }
  }

  async showSellerConfig(sellerId) {
    try {
      // Get seller data first
      const response = await apiClient.get(`/users/${sellerId}`);
      if (!response.success) {
        throw new Error('Error loading seller data');
      }

      const seller = response.data.user;

      const configHTML = `
        <div class="seller-config">
          <form id="sellerConfigForm">
            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Nombre Completo</label>
                  <input type="text" class="form-control" name="name" value="${seller.name}" required>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Usuario</label>
                  <input type="text" class="form-control" name="username" value="${seller.username}" required>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" name="email" value="${seller.email}" required>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Estado</label>
                  <select class="form-select" name="isActive">
                    <option value="true" ${seller.isActive ? 'selected' : ''}>Activo</option>
                    <option value="false" ${!seller.isActive ? 'selected' : ''}>Inactivo</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Rol</label>
                  <select class="form-select" name="role">
                    <option value="seller" ${seller.role === 'seller' ? 'selected' : ''}>Vendedor</option>
                    <option value="admin" ${seller.role === 'admin' ? 'selected' : ''}>Administrador</option>
                  </select>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Último Acceso</label>
                  <input type="text" class="form-control" value="${seller.lastAccess ? new Date(seller.lastAccess).toLocaleString('es-ES') : 'Nunca'}" readonly>
                </div>
              </div>
            </div>
          </form>
        </div>
      `;

      document.getElementById('sellerDetailsContent').innerHTML = configHTML;
      document.querySelector('#sellerDetailsModal .modal-title').textContent = 'Configurar Vendedor';
      
      // Update modal footer with save button
      let footer = document.querySelector('#sellerDetailsModal .modal-footer');
      if (!footer) {
        footer = document.createElement('div');
        footer.className = 'modal-footer';
        document.querySelector('#sellerDetailsModal .modal-content').appendChild(footer);
      }
      
      footer.innerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-primary" onclick="window.crmApp.saveSellerConfig('${sellerId}')">Guardar Cambios</button>
      `;

      const modal = new bootstrap.Modal(document.getElementById('sellerDetailsModal'));
      modal.show();

    } catch (error) {
      console.error('Error loading seller config:', error);
      alert('Error cargando configuración del vendedor: ' + error.message);
    }
  }

  async saveSellerConfig(sellerId) {
    try {
      const form = document.getElementById('sellerConfigForm');
      const formData = new FormData(form);
      
      const updateData = {
        name: formData.get('name'),
        username: formData.get('username'),
        email: formData.get('email'),
        role: formData.get('role'),
        isActive: formData.get('isActive') === 'true'
      };

      const response = await apiClient.put(`/users/${sellerId}`, updateData);
      
      if (response.success) {
        this.showToast('Éxito', 'Vendedor actualizado correctamente', 'success');
        const modal = bootstrap.Modal.getInstance(document.getElementById('sellerDetailsModal'));
        modal.hide();
        setTimeout(() => this.loadSellersContent(), 1000);
      } else {
        alert('Error: ' + response.message);
      }

    } catch (error) {
      console.error('Error saving seller config:', error);
      alert('Error guardando configuración: ' + error.message);
    }
  }

  async showSellerLeads(sellerId) {
    try {
      const modal = new bootstrap.Modal(document.getElementById('sellerDetailsModal'));
      const content = document.getElementById('sellerDetailsContent');
      
      // Show loading
      content.innerHTML = '<div class="text-center py-4"><div class="spinner-border"></div></div>';
      modal.show();

      // Load seller leads
      const response = await apiClient.get(`/users/${sellerId}/detailed-leads?limit=50`);
      
      if (!response.success) {
        throw new Error('Error loading seller leads');
      }

      const data = response.data;
      const seller = data.seller;
      const leads = data.leads;

      const leadsHTML = `
        <div class="seller-leads">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4>${seller.name}</h4>
              <p class="text-muted">Total: ${data.pagination.totalLeads} leads</p>
            </div>
            <div>
              <button class="btn btn-primary btn-sm me-2" onclick="window.crmApp.assignLeadsToSeller('${seller.id}')">
                <i class="bi bi-plus-circle me-1"></i>Asignar Más Leads
              </button>
              <button class="btn btn-info btn-sm" onclick="window.crmApp.showSellerAnalytics('${seller.id}')">
                <i class="bi bi-graph-up me-1"></i>Ver Analytics
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table table-hover">
              <thead class="table-dark">
                <tr>
                  <th>Lead</th>
                  <th>Estado</th>
                  <th>Último Contacto</th>
                  <th>Días Asignado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${leads.map(lead => `
                  <tr>
                    <td>
                      <div>
                        <strong>${lead.name}</strong>
                        ${lead.phone ? `<br><small class="text-muted">${lead.phone}</small>` : ''}
                      </div>
                    </td>
                    <td>
                      <span class="badge ${this.getStatusBadgeClass(lead.status)}">${this.getStatusText(lead.status)}</span>
                    </td>
                    <td>
                      ${lead.lastContact ? new Date(lead.lastContact).toLocaleDateString('es-ES') : '-'}
                      ${lead.daysSinceLastContact ? `<br><small class="text-muted">${lead.daysSinceLastContact} días</small>` : ''}
                    </td>
                    <td>
                      <span class="${lead.daysSinceAssigned > 7 ? 'text-warning' : 'text-muted'}">${lead.daysSinceAssigned} días</span>
                    </td>
                    <td>
                      <div class="btn-group" role="group">
                        <button class="btn btn-outline-primary btn-sm" onclick="window.crmApp.reassignLead('${lead._id}')">
                          <i class="bi bi-arrow-left-right"></i>
                        </button>
                        <button class="btn btn-outline-info btn-sm" onclick="window.crmApp.showLeadDetail('${lead._id}')">
                          <i class="bi bi-eye"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          ${data.pagination.totalPages > 1 ? `
            <div class="d-flex justify-content-center mt-3">
              <nav>
                <ul class="pagination pagination-sm">
                  ${data.pagination.hasPrev ? `<li class="page-item"><a class="page-link" onclick="window.crmApp.showSellerLeads('${seller.id}', ${data.pagination.currentPage - 1})">Anterior</a></li>` : ''}
                  <li class="page-item active"><span class="page-link">${data.pagination.currentPage}</span></li>
                  ${data.pagination.hasNext ? `<li class="page-item"><a class="page-link" onclick="window.crmApp.showSellerLeads('${seller.id}', ${data.pagination.currentPage + 1})">Siguiente</a></li>` : ''}
                </ul>
              </nav>
            </div>
          ` : ''}
        </div>
      `;

      content.innerHTML = leadsHTML;

    } catch (error) {
      console.error('Error loading seller leads:', error);
      document.getElementById('sellerDetailsContent').innerHTML = `
        <div class="alert alert-danger">
          <h4>Error</h4>
          <p>No se pudieron cargar los leads del vendedor: ${error.message}</p>
        </div>
      `;
    }
  }

  getStatusBadgeClass(status) {
    const classes = {
      'uncontacted': 'bg-secondary',
      'contacted': 'bg-info', 
      'interested': 'bg-warning',
      'meeting': 'bg-primary',
      'won': 'bg-success',
      'lost': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
  }

  getStatusText(status) {
    const texts = {
      'uncontacted': 'Sin contactar',
      'contacted': 'Contactado',
      'interested': 'Interesado', 
      'meeting': 'Reunión',
      'won': 'Ganado',
      'lost': 'Perdido'
    };
    return texts[status] || status;
  }

  // === LEADS MANAGEMENT FUNCTIONS ===
  
  renderLeadsTableRows(leads, sellers) {
    if (!leads || leads.length === 0) {
      return `
        <tr>
          <td colspan="9" class="text-center text-muted py-4">
            <i class="bi bi-inbox display-4 d-block mb-2"></i>
            No se encontraron leads
          </td>
        </tr>
      `;
    }

    return leads.map(lead => {
      const seller = sellers.find(s => s.id === lead.assigned_to);
      const statusBadge = this.getLeadStatusBadge(lead.status);
      const date = new Date(lead.created_at).toLocaleDateString();
      
      return `
        <tr>
          <td><input type="checkbox" class="lead-checkbox" value="${lead.id}"></td>
          <td>
            <strong>${lead.name || lead.nombre || 'N/A'}</strong>
            ${lead.company ? `<br><small class="text-muted">${lead.company}</small>` : ''}
          </td>
          <td>
            <a href="mailto:${lead.email}" class="text-decoration-none">
              ${lead.email}
            </a>
          </td>
          <td>
            <a href="tel:${lead.phone || lead.telefono}" class="text-decoration-none">
              ${lead.phone || lead.telefono || 'N/A'}
            </a>
          </td>
          <td>${lead.province || lead.provincia || 'N/A'}</td>
          <td>
            ${seller ? `<span class="badge bg-info">${seller.name}</span>` : 
              '<span class="badge bg-warning">Sin Asignar</span>'}
          </td>
          <td>${statusBadge}</td>
          <td>${date}</td>
          <td>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-primary" onclick="app.showLeadDetails(${lead.id})" 
                      title="Ver detalles">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-outline-success" onclick="app.showAssignLeadModal(${lead.id})" 
                      title="Asignar">
                <i class="bi bi-person-plus"></i>
              </button>
              <button class="btn btn-outline-warning" onclick="app.showEditLeadModal(${lead.id})" 
                      title="Editar">
                <i class="bi bi-pencil"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  getLeadStatusBadge(status) {
    const badges = {
      'nuevo': '<span class="badge bg-primary">Nuevo</span>',
      'contactado': '<span class="badge bg-secondary">Contactado</span>',
      'interesado': '<span class="badge bg-success">Interesado</span>',
      'no_interesado': '<span class="badge bg-danger">No Interesado</span>',
      'vendido': '<span class="badge bg-dark">Vendido</span>'
    };
    return badges[status] || `<span class="badge bg-light text-dark">${status}</span>`;
  }

  filterLeads() {
    if (!this.leadsData) return;

    const searchTerm = document.getElementById('leadsSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const sellerFilter = document.getElementById('sellerFilter')?.value || '';
    const provinceFilter = document.getElementById('provinceFilter')?.value || '';
    const dateFromFilter = document.getElementById('dateFromFilter')?.value || '';
    const dateToFilter = document.getElementById('dateToFilter')?.value || '';

    let filtered = this.leadsData.leads.filter(lead => {
      // Search in name, email, phone
      const searchMatch = !searchTerm || 
        (lead.name && lead.name.toLowerCase().includes(searchTerm)) ||
        (lead.nombre && lead.nombre.toLowerCase().includes(searchTerm)) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm)) ||
        (lead.phone && lead.phone.toLowerCase().includes(searchTerm)) ||
        (lead.telefono && lead.telefono.toLowerCase().includes(searchTerm));

      // Status filter
      const statusMatch = !statusFilter || lead.status === statusFilter;

      // Seller filter
      let sellerMatch = true;
      if (sellerFilter === 'unassigned') {
        sellerMatch = !lead.assigned_to;
      } else if (sellerFilter) {
        sellerMatch = lead.assigned_to == sellerFilter;
      }

      // Province filter
      const provinceMatch = !provinceFilter || 
        lead.province === provinceFilter || lead.provincia === provinceFilter;

      // Date range filter
      let dateMatch = true;
      if (dateFromFilter || dateToFilter) {
        const leadDate = new Date(lead.created_at);
        if (dateFromFilter) {
          dateMatch = dateMatch && leadDate >= new Date(dateFromFilter);
        }
        if (dateToFilter) {
          const toDate = new Date(dateToFilter);
          toDate.setHours(23, 59, 59, 999); // End of day
          dateMatch = dateMatch && leadDate <= toDate;
        }
      }

      return searchMatch && statusMatch && sellerMatch && provinceMatch && dateMatch;
    });

    this.filteredLeads = filtered;
    this.updateLeadsTable(filtered);
    this.updateLeadsSummary(filtered);
  }

  updateLeadsTable(leads) {
    const tableBody = document.getElementById('leadsTableBody');
    if (tableBody) {
      tableBody.innerHTML = this.renderLeadsTableRows(leads, this.leadsData.sellers);
    }
    
    // Update counts
    const showingCount = document.getElementById('showingCount');
    const totalCount = document.getElementById('totalCount');
    if (showingCount) showingCount.textContent = leads.length;
    if (totalCount) totalCount.textContent = this.leadsData.leads.length;
  }

  updateLeadsSummary(leads) {
    // Update summary cards
    document.getElementById('totalLeadsCount').textContent = this.leadsData.leads.length;
    document.getElementById('unassignedLeadsCount').textContent = 
      leads.filter(l => !l.assigned_to).length;
    document.getElementById('newLeadsCount').textContent = 
      leads.filter(l => l.status === 'nuevo').length;
    document.getElementById('contactedLeadsCount').textContent = 
      leads.filter(l => l.status === 'contactado').length;
    document.getElementById('interestedLeadsCount').textContent = 
      leads.filter(l => l.status === 'interesado').length;
    document.getElementById('soldLeadsCount').textContent = 
      leads.filter(l => l.status === 'vendido').length;
  }

  selectAllLeads(select) {
    const checkboxes = document.querySelectorAll('.lead-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = select;
    });
    
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = select;
    }
  }

  toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const isChecked = selectAllCheckbox.checked;
    this.selectAllLeads(isChecked);
  }

  getSelectedLeads() {
    const checkboxes = document.querySelectorAll('.lead-checkbox:checked');
    return Array.from(checkboxes).map(cb => parseInt(cb.value));
  }

  async showLeadDetails(leadId) {
    try {
      this.showLoading();
      const response = await apiManager.get(`/leads/${leadId}`);
      
      if (response.success && response.data) {
        const lead = response.data;
        const seller = this.leadsData.sellers.find(s => s.id === lead.assigned_to);
        
        const modal = `
          <div class="modal fade" id="leadDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">
                    <i class="bi bi-person-circle me-2"></i>Detalles del Lead
                  </h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                  <div class="row">
                    <div class="col-md-6">
                      <h6>Información Personal</h6>
                      <p><strong>Nombre:</strong> ${lead.name || lead.nombre || 'N/A'}</p>
                      <p><strong>Email:</strong> ${lead.email || 'N/A'}</p>
                      <p><strong>Teléfono:</strong> ${lead.phone || lead.telefono || 'N/A'}</p>
                      <p><strong>Provincia:</strong> ${lead.province || lead.provincia || 'N/A'}</p>
                      ${lead.company ? `<p><strong>Empresa:</strong> ${lead.company}</p>` : ''}
                    </div>
                    <div class="col-md-6">
                      <h6>Estado del Lead</h6>
                      <p><strong>Estado:</strong> ${this.getLeadStatusBadge(lead.status)}</p>
                      <p><strong>Vendedor:</strong> ${seller ? seller.name : 'Sin asignar'}</p>
                      <p><strong>Fecha de creación:</strong> ${new Date(lead.created_at).toLocaleString()}</p>
                      ${lead.updated_at ? `<p><strong>Última actualización:</strong> ${new Date(lead.updated_at).toLocaleString()}</p>` : ''}
                    </div>
                  </div>
                  ${lead.notes ? `
                    <div class="mt-3">
                      <h6>Notas</h6>
                      <div class="bg-light p-3 rounded">${lead.notes}</div>
                    </div>
                  ` : ''}
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-outline-success" onclick="app.showAssignLeadModal(${leadId})">
                    <i class="bi bi-person-plus me-2"></i>Asignar Vendedor
                  </button>
                  <button type="button" class="btn btn-primary" onclick="app.showEditLeadModal(${leadId})">
                    <i class="bi bi-pencil me-2"></i>Editar
                  </button>
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
              </div>
            </div>
          </div>
        `;
        
        // Remove existing modal
        const existingModal = document.getElementById('leadDetailsModal');
        if (existingModal) {
          existingModal.remove();
        }
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modal);
        
        // Show modal
        const modalEl = document.getElementById('leadDetailsModal');
        const bsModal = new bootstrap.Modal(modalEl);
        bsModal.show();
        
        // Clean up when modal is hidden
        modalEl.addEventListener('hidden.bs.modal', () => {
          modalEl.remove();
        });
      } else {
        this.showError('No se pudo cargar los detalles del lead');
      }
    } catch (error) {
      console.error('Error loading lead details:', error);
      this.showError('Error al cargar los detalles del lead');
    } finally {
      this.hideLoading();
    }
  }

  showCreateLeadModal() {
    const modal = `
      <div class="modal fade" id="createLeadModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-plus-circle me-2"></i>Crear Nuevo Lead
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form onsubmit="app.handleCreateLead(event)">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Nombre *</label>
                  <input type="text" class="form-control" name="name" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Email *</label>
                  <input type="email" class="form-control" name="email" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Teléfono</label>
                  <input type="tel" class="form-control" name="phone">
                </div>
                <div class="mb-3">
                  <label class="form-label">Provincia</label>
                  <select class="form-select" name="province">
                    <option value="">Seleccionar provincia...</option>
                    ${this.leadsData.provinces.map(p => `<option value="${p}">${p}</option>`).join('')}
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Empresa</label>
                  <input type="text" class="form-control" name="company">
                </div>
                <div class="mb-3">
                  <label class="form-label">Asignar a vendedor</label>
                  <select class="form-select" name="assigned_to">
                    <option value="">Sin asignar</option>
                    ${this.leadsData.sellers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Notas</label>
                  <textarea class="form-control" name="notes" rows="3"></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-success">
                  <i class="bi bi-plus me-2"></i>Crear Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('createLeadModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modal);
    
    // Show modal
    const modalEl = document.getElementById('createLeadModal');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
    
    // Clean up when modal is hidden
    modalEl.addEventListener('hidden.bs.modal', () => {
      modalEl.remove();
    });
  }

  async handleCreateLead(event) {
    event.preventDefault();
    
    try {
      this.showLoading();
      
      const formData = new FormData(event.target);
      const leadData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone') || null,
        province: formData.get('province') || null,
        company: formData.get('company') || null,
        assigned_to: formData.get('assigned_to') || null,
        notes: formData.get('notes') || null,
        status: 'nuevo'
      };

      const response = await apiManager.post('/leads', leadData);
      
      if (response.success) {
        this.showToast('Éxito', 'Lead creado correctamente', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createLeadModal'));
        modal.hide();
        
        // Refresh leads list
        this.loadLeadsManagement();
      } else {
        this.showError(response.message || 'Error al crear el lead');
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      this.showError('Error al crear el lead');
    } finally {
      this.hideLoading();
    }
  }

  showBulkAssignModal() {
    const modal = `
      <div class="modal fade" id="bulkAssignModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-distribute-vertical me-2"></i>Asignación Masiva de Leads
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form onsubmit="app.handleBulkAssign(event)">
              <div class="modal-body">
                <div class="alert alert-info">
                  <i class="bi bi-info-circle me-2"></i>
                  Esta acción asignará todos los leads seleccionados al vendedor elegido.
                </div>
                <div class="mb-3">
                  <label class="form-label">Seleccionar Vendedor *</label>
                  <select class="form-select" name="seller_id" required>
                    <option value="">Elegir vendedor...</option>
                    ${this.leadsData.sellers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Leads seleccionados</label>
                  <div id="selectedLeadsCount" class="form-text">
                    <span class="badge bg-primary">0</span> leads seleccionados
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-success" id="bulkAssignBtn" disabled>
                  <i class="bi bi-distribute-vertical me-2"></i>Asignar Leads
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('bulkAssignModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modal);
    
    // Show modal
    const modalEl = document.getElementById('bulkAssignModal');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
    
    // Update selected count
    this.updateBulkAssignModal();
    
    // Clean up when modal is hidden
    modalEl.addEventListener('hidden.bs.modal', () => {
      modalEl.remove();
    });
  }

  updateBulkAssignModal() {
    const selectedLeads = this.getSelectedLeads();
    const countElement = document.getElementById('selectedLeadsCount');
    const submitBtn = document.getElementById('bulkAssignBtn');
    
    if (countElement) {
      countElement.innerHTML = `<span class="badge bg-primary">${selectedLeads.length}</span> leads seleccionados`;
    }
    
    if (submitBtn) {
      submitBtn.disabled = selectedLeads.length === 0;
    }
  }

  async handleBulkAssign(event) {
    event.preventDefault();
    
    try {
      const selectedLeads = this.getSelectedLeads();
      if (selectedLeads.length === 0) {
        this.showError('Por favor selecciona al menos un lead');
        return;
      }

      this.showLoading();
      
      const formData = new FormData(event.target);
      const sellerId = formData.get('seller_id');
      
      const response = await apiManager.post('/leads/bulk-assign', {
        lead_ids: selectedLeads,
        seller_id: sellerId
      });
      
      if (response.success) {
        this.showToast('Éxito', `${selectedLeads.length} leads asignados correctamente`, 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('bulkAssignModal'));
        modal.hide();
        
        // Refresh leads list
        this.loadLeadsManagement();
      } else {
        this.showError(response.message || 'Error en la asignación masiva');
      }
    } catch (error) {
      console.error('Error in bulk assign:', error);
      this.showError('Error en la asignación masiva');
    } finally {
      this.hideLoading();
    }
  }

  showAssignLeadModal(leadId) {
    const modal = `
      <div class="modal fade" id="assignLeadModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-person-plus me-2"></i>Asignar Lead
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form onsubmit="app.handleAssignLead(event, ${leadId})">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Seleccionar Vendedor *</label>
                  <select class="form-select" name="seller_id" required>
                    <option value="">Elegir vendedor...</option>
                    ${this.leadsData.sellers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-success">
                  <i class="bi bi-person-plus me-2"></i>Asignar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('assignLeadModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modal);
    
    // Show modal
    const modalEl = document.getElementById('assignLeadModal');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
    
    // Clean up when modal is hidden
    modalEl.addEventListener('hidden.bs.modal', () => {
      modalEl.remove();
    });
  }

  async handleAssignLead(event, leadId) {
    event.preventDefault();
    
    try {
      this.showLoading();
      
      const formData = new FormData(event.target);
      const sellerId = formData.get('seller_id');
      
      const response = await apiManager.put(`/leads/${leadId}/assign`, {
        seller_id: sellerId
      });
      
      if (response.success) {
        this.showToast('Éxito', 'Lead asignado correctamente', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('assignLeadModal'));
        modal.hide();
        
        // Refresh leads list
        this.loadLeadsManagement();
      } else {
        this.showError(response.message || 'Error al asignar el lead');
      }
    } catch (error) {
      console.error('Error assigning lead:', error);
      this.showError('Error al asignar el lead');
    } finally {
      this.hideLoading();
    }
  }

  showEditLeadModal(leadId) {
    // Find the lead data
    const lead = this.leadsData.leads.find(l => l.id === leadId);
    if (!lead) {
      this.showError('Lead no encontrado');
      return;
    }

    const modal = `
      <div class="modal fade" id="editLeadModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-pencil me-2"></i>Editar Lead
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form onsubmit="app.handleEditLead(event, ${leadId})">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Nombre *</label>
                  <input type="text" class="form-control" name="name" value="${lead.name || lead.nombre || ''}" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Email *</label>
                  <input type="email" class="form-control" name="email" value="${lead.email || ''}" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Teléfono</label>
                  <input type="tel" class="form-control" name="phone" value="${lead.phone || lead.telefono || ''}">
                </div>
                <div class="mb-3">
                  <label class="form-label">Provincia</label>
                  <select class="form-select" name="province">
                    <option value="">Seleccionar provincia...</option>
                    ${this.leadsData.provinces.map(p => 
                      `<option value="${p}" ${(lead.province === p || lead.provincia === p) ? 'selected' : ''}>${p}</option>`
                    ).join('')}
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Estado</label>
                  <select class="form-select" name="status">
                    <option value="nuevo" ${lead.status === 'nuevo' ? 'selected' : ''}>Nuevo</option>
                    <option value="contactado" ${lead.status === 'contactado' ? 'selected' : ''}>Contactado</option>
                    <option value="interesado" ${lead.status === 'interesado' ? 'selected' : ''}>Interesado</option>
                    <option value="no_interesado" ${lead.status === 'no_interesado' ? 'selected' : ''}>No Interesado</option>
                    <option value="vendido" ${lead.status === 'vendido' ? 'selected' : ''}>Vendido</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Empresa</label>
                  <input type="text" class="form-control" name="company" value="${lead.company || ''}">
                </div>
                <div class="mb-3">
                  <label class="form-label">Vendedor asignado</label>
                  <select class="form-select" name="assigned_to">
                    <option value="">Sin asignar</option>
                    ${this.leadsData.sellers.map(s => 
                      `<option value="${s.id}" ${lead.assigned_to == s.id ? 'selected' : ''}>${s.name}</option>`
                    ).join('')}
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Notas</label>
                  <textarea class="form-control" name="notes" rows="3">${lead.notes || ''}</textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-primary">
                  <i class="bi bi-save me-2"></i>Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('editLeadModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modal);
    
    // Show modal
    const modalEl = document.getElementById('editLeadModal');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
    
    // Clean up when modal is hidden
    modalEl.addEventListener('hidden.bs.modal', () => {
      modalEl.remove();
    });
  }

  async handleEditLead(event, leadId) {
    event.preventDefault();
    
    try {
      this.showLoading();
      
      const formData = new FormData(event.target);
      const leadData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone') || null,
        province: formData.get('province') || null,
        status: formData.get('status'),
        company: formData.get('company') || null,
        assigned_to: formData.get('assigned_to') || null,
        notes: formData.get('notes') || null
      };

      const response = await apiManager.put(`/leads/${leadId}`, leadData);
      
      if (response.success) {
        this.showToast('Éxito', 'Lead actualizado correctamente', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editLeadModal'));
        modal.hide();
        
        // Refresh leads list
        this.loadLeadsManagement();
      } else {
        this.showError(response.message || 'Error al actualizar el lead');
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      this.showError('Error al actualizar el lead');
    } finally {
      this.hideLoading();
    }
  }

  initializeTooltips() {
    // Initialize Bootstrap tooltips if available
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
      const tooltipTriggerList = [].slice.call(document.querySelectorAll('[title]'));
      tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
      });
    }
  }

  // === USERS MANAGEMENT FUNCTIONS ===

  renderUsersTableRows(users) {
    if (!users || users.length === 0) {
      return `
        <tr>
          <td colspan="8" class="text-center text-muted py-4">
            <i class="bi bi-person-x display-4 d-block mb-2"></i>
            No se encontraron usuarios
          </td>
        </tr>
      `;
    }

    return users.map(user => {
      const roleBadge = this.getUserRoleBadge(user.role);
      const statusBadge = this.getUserStatusBadge(user.status || 'active');
      const registrationDate = new Date(user.created_at || Date.now()).toLocaleDateString();
      const lastLogin = user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Nunca';
      
      return `
        <tr>
          <td>
            <div class="d-flex align-items-center">
              <div class="user-avatar me-2">
                <i class="bi bi-person-circle fs-4 text-muted"></i>
              </div>
              <div>
                <strong>${user.name || 'N/A'}</strong>
                <br><small class="text-muted">@${user.username}</small>
              </div>
            </div>
          </td>
          <td>
            <a href="mailto:${user.email}" class="text-decoration-none">
              ${user.email}
            </a>
          </td>
          <td>${roleBadge}</td>
          <td>${statusBadge}</td>
          <td>
            <span class="badge bg-primary">${user.assigned_leads_count || 0}</span>
          </td>
          <td>
            <small>${lastLogin}</small>
          </td>
          <td>
            <small>${registrationDate}</small>
          </td>
          <td>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-primary" onclick="app.showUserDetails(${user.id})" 
                      title="Ver detalles">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-outline-warning" onclick="app.showEditUserModal(${user.id})" 
                      title="Editar">
                <i class="bi bi-pencil"></i>
              </button>
              ${user.role !== 'admin' ? `
                <button class="btn btn-outline-danger" onclick="app.showDeleteUserModal(${user.id})" 
                        title="Eliminar">
                  <i class="bi bi-trash"></i>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  getUserRoleBadge(role) {
    const badges = {
      'admin': '<span class="badge bg-danger">Administrador</span>',
      'seller': '<span class="badge bg-success">Vendedor</span>'
    };
    return badges[role] || `<span class="badge bg-secondary">${role}</span>`;
  }

  getUserStatusBadge(status) {
    const badges = {
      'active': '<span class="badge bg-success">Activo</span>',
      'inactive': '<span class="badge bg-secondary">Inactivo</span>',
      'suspended': '<span class="badge bg-warning">Suspendido</span>'
    };
    return badges[status] || `<span class="badge bg-light text-dark">${status}</span>`;
  }

  renderSellerPerformanceRows(sellers) {
    if (!sellers || sellers.length === 0) {
      return `
        <tr>
          <td colspan="4" class="text-center text-muted">
            <i class="bi bi-graph-down"></i> No hay datos de rendimiento disponibles
          </td>
        </tr>
      `;
    }

    return sellers.map(seller => {
      const assignedCount = seller.assigned_leads_count || 0;
      const conversions = seller.conversions || 0;
      const successRate = assignedCount > 0 ? Math.round((conversions / assignedCount) * 100) : 0;
      
      return `
        <tr>
          <td>
            <strong>${seller.name}</strong>
            <br><small class="text-muted">${seller.email}</small>
          </td>
          <td><span class="badge bg-primary">${assignedCount}</span></td>
          <td><span class="badge bg-success">${conversions}</span></td>
          <td>
            <div class="d-flex align-items-center">
              <div class="progress me-2" style="width: 60px; height: 8px;">
                <div class="progress-bar ${successRate >= 70 ? 'bg-success' : successRate >= 40 ? 'bg-warning' : 'bg-danger'}" 
                     style="width: ${successRate}%"></div>
              </div>
              <small>${successRate}%</small>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderRecentUserActivity(users) {
    // Sort users by last activity/login
    const recentUsers = users
      .filter(u => u.last_login)
      .sort((a, b) => new Date(b.last_login) - new Date(a.last_login))
      .slice(0, 5);

    if (recentUsers.length === 0) {
      return `
        <div class="text-center text-muted py-3">
          <i class="bi bi-clock-history"></i> No hay actividad reciente
        </div>
      `;
    }

    return recentUsers.map(user => {
      const timeAgo = this.getTimeAgo(new Date(user.last_login));
      return `
        <div class="d-flex align-items-center py-2 border-bottom">
          <i class="bi bi-person-circle text-muted me-3"></i>
          <div class="flex-grow-1">
            <div class="fw-bold">${user.name}</div>
            <small class="text-muted">Último acceso: ${timeAgo}</small>
          </div>
          <span class="badge bg-outline-secondary">${user.role}</span>
        </div>
      `;
    }).join('');
  }

  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else {
      return `${diffDays}d`;
    }
  }

  filterUsers() {
    if (!this.usersData) return;

    const searchTerm = document.getElementById('usersSearch')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('roleFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';

    let filtered = this.usersData.users.filter(user => {
      // Search in name, email, username
      const searchMatch = !searchTerm || 
        (user.name && user.name.toLowerCase().includes(searchTerm)) ||
        (user.email && user.email.toLowerCase().includes(searchTerm)) ||
        (user.username && user.username.toLowerCase().includes(searchTerm));

      // Role filter
      const roleMatch = !roleFilter || user.role === roleFilter;

      // Status filter - default to active if no status is set
      const userStatus = user.status || 'active';
      const statusMatch = !statusFilter || userStatus === statusFilter;

      return searchMatch && roleMatch && statusMatch;
    });

    this.filteredUsers = filtered;
    this.updateUsersTable(filtered);
  }

  updateUsersTable(users) {
    const tableBody = document.getElementById('usersTableBody');
    if (tableBody) {
      tableBody.innerHTML = this.renderUsersTableRows(users);
    }
    
    // Update counts
    const showingCount = document.getElementById('showingUsersCount');
    const totalCount = document.getElementById('totalUsersCount');
    if (showingCount) showingCount.textContent = users.length;
    if (totalCount) totalCount.textContent = this.usersData.users.length;
  }

  async showUserDetails(userId) {
    try {
      this.showLoading();
      const response = await apiManager.get(`/users/${userId}`);
      
      if (response.success && response.data) {
        const user = response.data;
        
        const modal = `
          <div class="modal fade" id="userDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">
                    <i class="bi bi-person-circle me-2"></i>Detalles del Usuario
                  </h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                  <div class="row">
                    <div class="col-md-6">
                      <h6>Información Personal</h6>
                      <p><strong>Nombre:</strong> ${user.name || 'N/A'}</p>
                      <p><strong>Usuario:</strong> ${user.username}</p>
                      <p><strong>Email:</strong> ${user.email}</p>
                      <p><strong>Rol:</strong> ${this.getUserRoleBadge(user.role)}</p>
                      <p><strong>Estado:</strong> ${this.getUserStatusBadge(user.status || 'active')}</p>
                    </div>
                    <div class="col-md-6">
                      <h6>Estadísticas</h6>
                      <p><strong>Leads Asignados:</strong> <span class="badge bg-primary">${user.assigned_leads_count || 0}</span></p>
                      <p><strong>Conversiones:</strong> <span class="badge bg-success">${user.conversions || 0}</span></p>
                      <p><strong>Fecha de Registro:</strong> ${new Date(user.created_at || Date.now()).toLocaleDateString()}</p>
                      <p><strong>Último Acceso:</strong> ${user.last_login ? new Date(user.last_login).toLocaleString() : 'Nunca'}</p>
                    </div>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-primary" onclick="app.showEditUserModal(${userId})">
                    <i class="bi bi-pencil me-2"></i>Editar Usuario
                  </button>
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
              </div>
            </div>
          </div>
        `;
        
        // Remove existing modal
        const existingModal = document.getElementById('userDetailsModal');
        if (existingModal) {
          existingModal.remove();
        }
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modal);
        
        // Show modal
        const modalEl = document.getElementById('userDetailsModal');
        const bsModal = new bootstrap.Modal(modalEl);
        bsModal.show();
        
        // Clean up when modal is hidden
        modalEl.addEventListener('hidden.bs.modal', () => {
          modalEl.remove();
        });
      } else {
        this.showError('No se pudo cargar los detalles del usuario');
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      this.showError('Error al cargar los detalles del usuario');
    } finally {
      this.hideLoading();
    }
  }

  showCreateUserModal() {
    const modal = `
      <div class="modal fade" id="createUserModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-person-plus me-2"></i>Crear Nuevo Usuario
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form onsubmit="app.handleCreateUser(event)">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Nombre Completo *</label>
                  <input type="text" class="form-control" name="name" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Nombre de Usuario *</label>
                  <input type="text" class="form-control" name="username" required>
                  <div class="form-text">Sin espacios, solo letras, números y guiones</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Email *</label>
                  <input type="email" class="form-control" name="email" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Contraseña *</label>
                  <input type="password" class="form-control" name="password" required>
                  <div class="form-text">Mínimo 6 caracteres</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Confirmar Contraseña *</label>
                  <input type="password" class="form-control" name="password_confirm" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Rol *</label>
                  <select class="form-select" name="role" required>
                    <option value="">Seleccionar rol...</option>
                    <option value="seller">Vendedor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Estado</label>
                  <select class="form-select" name="status">
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-success">
                  <i class="bi bi-person-plus me-2"></i>Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('createUserModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modal);
    
    // Show modal
    const modalEl = document.getElementById('createUserModal');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
    
    // Clean up when modal is hidden
    modalEl.addEventListener('hidden.bs.modal', () => {
      modalEl.remove();
    });
  }

  async handleCreateUser(event) {
    event.preventDefault();
    
    try {
      this.showLoading();
      
      const formData = new FormData(event.target);
      
      // Validate password confirmation
      const password = formData.get('password');
      const passwordConfirm = formData.get('password_confirm');
      
      if (password !== passwordConfirm) {
        this.showError('Las contraseñas no coinciden');
        return;
      }
      
      const userData = {
        name: formData.get('name'),
        username: formData.get('username'),
        email: formData.get('email'),
        password: password,
        role: formData.get('role'),
        status: formData.get('status') || 'active'
      };

      const response = await apiManager.post('/users', userData);
      
      if (response.success) {
        this.showToast('Éxito', 'Usuario creado correctamente', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createUserModal'));
        modal.hide();
        
        // Refresh users list
        this.loadUsersManagement();
      } else {
        this.showError(response.message || 'Error al crear el usuario');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      this.showError('Error al crear el usuario');
    } finally {
      this.hideLoading();
    }
  }

  showEditUserModal(userId) {
    // Find the user data
    const user = this.usersData.users.find(u => u.id === userId);
    if (!user) {
      this.showError('Usuario no encontrado');
      return;
    }

    const modal = `
      <div class="modal fade" id="editUserModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-pencil me-2"></i>Editar Usuario
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form onsubmit="app.handleEditUser(event, ${userId})">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Nombre Completo *</label>
                  <input type="text" class="form-control" name="name" value="${user.name || ''}" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Nombre de Usuario *</label>
                  <input type="text" class="form-control" name="username" value="${user.username}" required>
                  <div class="form-text">Sin espacios, solo letras, números y guiones</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Email *</label>
                  <input type="email" class="form-control" name="email" value="${user.email}" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Nueva Contraseña</label>
                  <input type="password" class="form-control" name="password">
                  <div class="form-text">Dejar en blanco para mantener la contraseña actual</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Confirmar Nueva Contraseña</label>
                  <input type="password" class="form-control" name="password_confirm">
                </div>
                <div class="mb-3">
                  <label class="form-label">Rol *</label>
                  <select class="form-select" name="role" required>
                    <option value="seller" ${user.role === 'seller' ? 'selected' : ''}>Vendedor</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Estado</label>
                  <select class="form-select" name="status">
                    <option value="active" ${(user.status || 'active') === 'active' ? 'selected' : ''}>Activo</option>
                    <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactivo</option>
                    <option value="suspended" ${user.status === 'suspended' ? 'selected' : ''}>Suspendido</option>
                  </select>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-primary">
                  <i class="bi bi-save me-2"></i>Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('editUserModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modal);
    
    // Show modal
    const modalEl = document.getElementById('editUserModal');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
    
    // Clean up when modal is hidden
    modalEl.addEventListener('hidden.bs.modal', () => {
      modalEl.remove();
    });
  }

  async handleEditUser(event, userId) {
    event.preventDefault();
    
    try {
      this.showLoading();
      
      const formData = new FormData(event.target);
      
      // Validate password confirmation if password is provided
      const password = formData.get('password');
      const passwordConfirm = formData.get('password_confirm');
      
      if (password && password !== passwordConfirm) {
        this.showError('Las contraseñas no coinciden');
        return;
      }
      
      const userData = {
        name: formData.get('name'),
        username: formData.get('username'),
        email: formData.get('email'),
        role: formData.get('role'),
        status: formData.get('status')
      };
      
      // Only include password if provided
      if (password) {
        userData.password = password;
      }

      const response = await apiManager.put(`/users/${userId}`, userData);
      
      if (response.success) {
        this.showToast('Éxito', 'Usuario actualizado correctamente', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
        modal.hide();
        
        // Refresh users list
        this.loadUsersManagement();
      } else {
        this.showError(response.message || 'Error al actualizar el usuario');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      this.showError('Error al actualizar el usuario');
    } finally {
      this.hideLoading();
    }
  }

  showDeleteUserModal(userId) {
    const user = this.usersData.users.find(u => u.id === userId);
    if (!user) {
      this.showError('Usuario no encontrado');
      return;
    }

    const modal = `
      <div class="modal fade" id="deleteUserModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title text-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>Eliminar Usuario
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                <strong>¡Atención!</strong> Esta acción no se puede deshacer.
              </div>
              <p>¿Estás seguro de que quieres eliminar al usuario:</p>
              <div class="bg-light p-3 rounded">
                <strong>${user.name}</strong><br>
                <span class="text-muted">${user.email}</span><br>
                <span class="badge bg-${user.role === 'admin' ? 'danger' : 'success'}">${user.role}</span>
              </div>
              <p class="mt-3 text-danger">
                <strong>Nota:</strong> Todos los leads asignados a este usuario quedarán sin asignar.
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-danger" onclick="app.handleDeleteUser(${userId})">
                <i class="bi bi-trash me-2"></i>Eliminar Usuario
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('deleteUserModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modal);
    
    // Show modal
    const modalEl = document.getElementById('deleteUserModal');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
    
    // Clean up when modal is hidden
    modalEl.addEventListener('hidden.bs.modal', () => {
      modalEl.remove();
    });
  }

  async handleDeleteUser(userId) {
    try {
      this.showLoading();
      
      const response = await apiManager.delete(`/users/${userId}`);
      
      if (response.success) {
        this.showToast('Éxito', 'Usuario eliminado correctamente', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteUserModal'));
        modal.hide();
        
        // Refresh users list
        this.loadUsersManagement();
      } else {
        this.showError(response.message || 'Error al eliminar el usuario');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      this.showError('Error al eliminar el usuario');
    } finally {
      this.hideLoading();
    }
  }

  exportUsersData() {
    if (!this.filteredUsers || this.filteredUsers.length === 0) {
      this.showError('No hay datos para exportar');
      return;
    }

    try {
      // Prepare data for export
      const exportData = this.filteredUsers.map(user => ({
        'Nombre': user.name || 'N/A',
        'Usuario': user.username,
        'Email': user.email,
        'Rol': user.role,
        'Estado': user.status || 'active',
        'Leads Asignados': user.assigned_leads_count || 0,
        'Conversiones': user.conversions || 0,
        'Fecha Registro': new Date(user.created_at || Date.now()).toLocaleDateString(),
        'Último Acceso': user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Nunca'
      }));

      // Convert to CSV
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => 
            `"${String(row[header]).replace(/"/g, '""')}"`
          ).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.showToast('Éxito', 'Datos exportados correctamente', 'success');
    } catch (error) {
      console.error('Error exporting users data:', error);
      this.showError('Error al exportar los datos');
    }
  }

  // === IMPORT TOOL FUNCTIONS ===

  renderImportHistoryRows(importHistory) {
    if (!importHistory || importHistory.length === 0) {
      return `
        <tr>
          <td colspan="8" class="text-center text-muted py-4">
            <i class="bi bi-clock-history display-4 d-block mb-2"></i>
            No hay importaciones previas
          </td>
        </tr>
      `;
    }

    return importHistory.map(importRecord => {
      const statusBadge = this.getImportStatusBadge(importRecord.status);
      const date = new Date(importRecord.created_at || Date.now()).toLocaleString();
      
      return `
        <tr>
          <td>
            <i class="bi bi-file-earmark-text me-2"></i>
            <strong>${importRecord.filename || 'N/A'}</strong>
            <br><small class="text-muted">${this.formatFileSize(importRecord.file_size || 0)}</small>
          </td>
          <td>${statusBadge}</td>
          <td><span class="badge bg-primary">${importRecord.processed_records || 0}</span></td>
          <td><span class="badge bg-success">${importRecord.successful_records || 0}</span></td>
          <td><span class="badge bg-danger">${importRecord.failed_records || 0}</span></td>
          <td><small>${date}</small></td>
          <td>
            <span class="badge bg-secondary">${importRecord.user_name || 'Sistema'}</span>
          </td>
          <td>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-primary" onclick="app.showImportDetails(${importRecord.id})" 
                      title="Ver detalles">
                <i class="bi bi-eye"></i>
              </button>
              ${importRecord.failed_records > 0 ? `
                <button class="btn btn-outline-warning" onclick="app.downloadFailedRecords(${importRecord.id})" 
                        title="Descargar errores">
                  <i class="bi bi-download"></i>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  getImportStatusBadge(status) {
    const badges = {
      'completed': '<span class="badge bg-success">Completado</span>',
      'processing': '<span class="badge bg-warning">Procesando</span>',
      'failed': '<span class="badge bg-danger">Fallido</span>',
      'pending': '<span class="badge bg-secondary">Pendiente</span>'
    };
    return badges[status] || `<span class="badge bg-light text-dark">${status}</span>`;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  showImportModal() {
    const modal = `
      <div class="modal fade" id="importModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-file-earmark-arrow-up me-2"></i>Importar Leads
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form onsubmit="app.handleImportFile(event)" id="importForm">
              <div class="modal-body">
                <!-- File Upload Section -->
                <div class="mb-4">
                  <label class="form-label">Seleccionar Archivo *</label>
                  <div class="upload-area border border-2 border-dashed rounded p-4 text-center" 
                       onclick="document.getElementById('fileInput').click()" 
                       ondragover="app.handleDragOver(event)" 
                       ondrop="app.handleFileDrop(event)">
                    <i class="bi bi-cloud-upload display-4 text-muted d-block mb-2"></i>
                    <p class="mb-2">Arrastra y suelta tu archivo aquí o haz clic para seleccionar</p>
                    <small class="text-muted">CSV, Excel (.xlsx, .xls) - Máximo 5MB</small>
                    <input type="file" id="fileInput" name="file" accept=".csv,.xlsx,.xls" 
                           style="display: none;" onchange="app.handleFileSelect(event)" required>
                  </div>
                  <div id="fileInfo" class="mt-2" style="display: none;"></div>
                </div>
                
                <!-- Import Options -->
                <div class="mb-3">
                  <label class="form-label">Asignar leads importados a vendedor</label>
                  <select class="form-select" name="assign_to_seller">
                    <option value="">No asignar (quedarán sin asignar)</option>
                    ${this.importData.sellers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                  </select>
                </div>
                
                <!-- Advanced Options -->
                <div class="accordion" id="advancedOptions">
                  <div class="accordion-item">
                    <h2 class="accordion-header">
                      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#advancedSettings">
                        <i class="bi bi-gear me-2"></i>Opciones Avanzadas
                      </button>
                    </h2>
                    <div id="advancedSettings" class="accordion-collapse collapse" data-bs-parent="#advancedOptions">
                      <div class="accordion-body">
                        <div class="row">
                          <div class="col-md-6">
                            <div class="form-check">
                              <input class="form-check-input" type="checkbox" name="skip_duplicates" id="skipDuplicates" checked>
                              <label class="form-check-label" for="skipDuplicates">
                                Omitir emails duplicados
                              </label>
                            </div>
                            <div class="form-check">
                              <input class="form-check-input" type="checkbox" name="validate_emails" id="validateEmails" checked>
                              <label class="form-check-label" for="validateEmails">
                                Validar formato de emails
                              </label>
                            </div>
                          </div>
                          <div class="col-md-6">
                            <div class="form-check">
                              <input class="form-check-input" type="checkbox" name="send_notification" id="sendNotification">
                              <label class="form-check-label" for="sendNotification">
                                Notificar por email al completar
                              </label>
                            </div>
                            <div class="form-check">
                              <input class="form-check-input" type="checkbox" name="create_backup" id="createBackup" checked>
                              <label class="form-check-label" for="createBackup">
                                Crear respaldo antes de importar
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-success" id="importBtn">
                  <i class="bi bi-upload me-2"></i>Iniciar Importación
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('importModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modal);
    
    // Show modal
    const modalEl = document.getElementById('importModal');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
    
    // Clean up when modal is hidden
    modalEl.addEventListener('hidden.bs.modal', () => {
      modalEl.remove();
    });
  }

  handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    event.currentTarget.classList.add('border-primary');
  }

  handleFileDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('border-primary');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const fileInput = document.getElementById('fileInput');
      fileInput.files = files;
      this.displayFileInfo(files[0]);
    }
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      this.displayFileInfo(file);
    }
  }

  displayFileInfo(file) {
    const fileInfo = document.getElementById('fileInfo');
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    let isValid = true;
    let message = '';
    let statusClass = 'text-success';
    
    // Validate file size
    if (file.size > maxSize) {
      isValid = false;
      message = 'El archivo es demasiado grande. Máximo permitido: 5MB';
      statusClass = 'text-danger';
    }
    
    // Validate file type
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!validTypes.includes(fileExtension)) {
      isValid = false;
      message = 'Tipo de archivo no válido. Use CSV o Excel (.xlsx, .xls)';
      statusClass = 'text-danger';
    }
    
    if (isValid) {
      message = `Archivo seleccionado: ${file.name} (${this.formatFileSize(file.size)})`;
    }
    
    fileInfo.innerHTML = `<div class="${statusClass}"><i class="bi bi-${isValid ? 'check-circle' : 'x-circle'} me-2"></i>${message}</div>`;
    fileInfo.style.display = 'block';
    
    // Enable/disable submit button
    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
      importBtn.disabled = !isValid;
    }
  }

  async handleImportFile(event) {
    event.preventDefault();
    
    try {
      this.showLoading();
      
      const formData = new FormData(event.target);
      
      const file = formData.get('file');
      if (!file || file.size === 0) {
        this.showError('Por favor selecciona un archivo válido');
        return;
      }
      
      // Show progress card
      const progressCard = document.getElementById('importProgressCard');
      if (progressCard) {
        progressCard.style.display = 'block';
        progressCard.scrollIntoView({ behavior: 'smooth' });
      }
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('importModal'));
      modal.hide();
      
      // Start import process
      await this.processImport(formData);
      
    } catch (error) {
      console.error('Error importing file:', error);
      this.showError('Error al importar el archivo');
    } finally {
      this.hideLoading();
    }
  }

  async processImport(formData) {
    try {
      // Update progress
      this.updateImportProgress(10, 'Subiendo archivo...');
      
      const response = await apiManager.postFormData('/import/upload', formData);
      
      if (response.success) {
        const importId = response.data.import_id;
        
        // Start polling for progress
        await this.pollImportProgress(importId);
        
      } else {
        throw new Error(response.message || 'Error al subir el archivo');
      }
    } catch (error) {
      this.updateImportProgress(0, `Error: ${error.message}`, 'danger');
      throw error;
    }
  }

  async pollImportProgress(importId) {
    const pollInterval = 2000; // 2 seconds
    let attempts = 0;
    const maxAttempts = 150; // 5 minutes max
    
    const poll = async () => {
      try {
        attempts++;
        const response = await apiManager.get(`/import/status/${importId}`);
        
        if (response.success && response.data) {
          const status = response.data;
          
          // Update progress based on status
          const progress = Math.min(90, (status.processed / status.total) * 100);
          this.updateImportProgress(progress, `Procesando: ${status.processed}/${status.total} registros`);
          
          if (status.status === 'completed') {
            this.updateImportProgress(100, 'Importación completada exitosamente', 'success');
            this.showImportResults(status);
            return;
          }
          
          if (status.status === 'failed') {
            this.updateImportProgress(0, `Error: ${status.error_message}`, 'danger');
            return;
          }
          
          // Continue polling if still processing
          if (status.status === 'processing' && attempts < maxAttempts) {
            setTimeout(poll, pollInterval);
          } else if (attempts >= maxAttempts) {
            this.updateImportProgress(0, 'Tiempo agotado - verifica el historial', 'warning');
          }
        }
      } catch (error) {
        console.error('Error polling import status:', error);
        this.updateImportProgress(0, 'Error al verificar el estado', 'danger');
      }
    };
    
    // Start polling
    setTimeout(poll, pollInterval);
  }

  updateImportProgress(percentage, message, type = 'info') {
    const progressBar = document.getElementById('importProgress');
    const statusDiv = document.getElementById('importStatus');
    
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
      progressBar.setAttribute('aria-valuenow', percentage);
      
      // Update color based on type
      progressBar.className = 'progress-bar';
      if (type === 'success') {
        progressBar.classList.add('bg-success');
      } else if (type === 'danger') {
        progressBar.classList.add('bg-danger');
      } else if (type === 'warning') {
        progressBar.classList.add('bg-warning');
      } else {
        progressBar.classList.add('progress-bar-striped', 'progress-bar-animated');
      }
    }
    
    if (statusDiv) {
      const icon = type === 'success' ? 'check-circle' : type === 'danger' ? 'x-circle' : 'hourglass-split';
      statusDiv.innerHTML = `<i class="bi bi-${icon} me-2"></i>${message}`;
    }
  }

  showImportResults(results) {
    const modal = `
      <div class="modal fade" id="importResultsModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-check-circle text-success me-2"></i>Importación Completada
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="row text-center mb-4">
                <div class="col-4">
                  <div class="card bg-primary text-white">
                    <div class="card-body">
                      <h3>${results.total || 0}</h3>
                      <small>Total Procesados</small>
                    </div>
                  </div>
                </div>
                <div class="col-4">
                  <div class="card bg-success text-white">
                    <div class="card-body">
                      <h3>${results.successful || 0}</h3>
                      <small>Exitosos</small>
                    </div>
                  </div>
                </div>
                <div class="col-4">
                  <div class="card bg-danger text-white">
                    <div class="card-body">
                      <h3>${results.failed || 0}</h3>
                      <small>Fallidos</small>
                    </div>
                  </div>
                </div>
              </div>
              
              ${results.failed > 0 ? `
                <div class="alert alert-warning">
                  <i class="bi bi-exclamation-triangle me-2"></i>
                  Algunos registros no pudieron importarse. Los errores más comunes son:
                  <ul class="mt-2">
                    <li>Emails duplicados</li>
                    <li>Formato de email inválido</li>
                    <li>Campos requeridos vacíos</li>
                  </ul>
                </div>
              ` : ''}
              
              <div class="alert alert-success">
                <i class="bi bi-check-circle me-2"></i>
                Los leads importados exitosamente ya están disponibles en el sistema.
              </div>
            </div>
            <div class="modal-footer">
              ${results.failed > 0 ? `
                <button type="button" class="btn btn-warning" onclick="app.downloadFailedRecords(${results.import_id})">
                  <i class="bi bi-download me-2"></i>Descargar Errores
                </button>
              ` : ''}
              <button type="button" class="btn btn-primary" onclick="app.loadLeadsManagement()">
                <i class="bi bi-list me-2"></i>Ver Leads
              </button>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('importResultsModal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modal);
    
    // Show modal
    const modalEl = document.getElementById('importResultsModal');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
    
    // Clean up when modal is hidden
    modalEl.addEventListener('hidden.bs.modal', () => {
      modalEl.remove();
      // Refresh the import tool view
      this.loadImportTool();
    });
  }

  downloadImportTemplate() {
    try {
      // Create template data
      const templateData = [
        {
          'nombre': 'Juan Pérez',
          'email': 'juan@example.com',
          'telefono': '+34 600 123 456',
          'provincia': 'Madrid',
          'empresa': 'Empresa Ejemplo',
          'notas': 'Lead de ejemplo'
        },
        {
          'nombre': 'María García',
          'email': 'maria@example.com',
          'telefono': '+34 700 987 654',
          'provincia': 'Barcelona',
          'empresa': 'Otra Empresa',
          'notas': 'Contacto interesado'
        }
      ];

      // Convert to CSV
      const headers = Object.keys(templateData[0]);
      const csvContent = [
        headers.join(','),
        ...templateData.map(row => 
          headers.map(header => 
            `"${String(row[header]).replace(/"/g, '""')}"`
          ).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'plantilla_leads.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.showToast('Éxito', 'Plantilla descargada correctamente', 'success');
    } catch (error) {
      console.error('Error downloading template:', error);
      this.showError('Error al descargar la plantilla');
    }
  }

  async showImportDetails(importId) {
    try {
      this.showLoading();
      const response = await apiManager.get(`/import/details/${importId}`);
      
      if (response.success && response.data) {
        const details = response.data;
        
        const modal = `
          <div class="modal fade" id="importDetailsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">
                    <i class="bi bi-info-circle me-2"></i>Detalles de Importación
                  </h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                  <div class="row">
                    <div class="col-md-6">
                      <h6>Información del Archivo</h6>
                      <p><strong>Nombre:</strong> ${details.filename}</p>
                      <p><strong>Tamaño:</strong> ${this.formatFileSize(details.file_size)}</p>
                      <p><strong>Estado:</strong> ${this.getImportStatusBadge(details.status)}</p>
                      <p><strong>Fecha:</strong> ${new Date(details.created_at).toLocaleString()}</p>
                    </div>
                    <div class="col-md-6">
                      <h6>Resultados</h6>
                      <p><strong>Total Procesados:</strong> <span class="badge bg-primary">${details.processed_records}</span></p>
                      <p><strong>Exitosos:</strong> <span class="badge bg-success">${details.successful_records}</span></p>
                      <p><strong>Fallidos:</strong> <span class="badge bg-danger">${details.failed_records}</span></p>
                      <p><strong>Usuario:</strong> ${details.user_name}</p>
                    </div>
                  </div>
                  
                  ${details.error_summary ? `
                    <div class="mt-3">
                      <h6>Resumen de Errores</h6>
                      <div class="bg-light p-3 rounded">
                        <pre>${details.error_summary}</pre>
                      </div>
                    </div>
                  ` : ''}
                </div>
                <div class="modal-footer">
                  ${details.failed_records > 0 ? `
                    <button type="button" class="btn btn-warning" onclick="app.downloadFailedRecords(${importId})">
                      <i class="bi bi-download me-2"></i>Descargar Errores
                    </button>
                  ` : ''}
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
              </div>
            </div>
          </div>
        `;
        
        // Remove existing modal
        const existingModal = document.getElementById('importDetailsModal');
        if (existingModal) {
          existingModal.remove();
        }
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modal);
        
        // Show modal
        const modalEl = document.getElementById('importDetailsModal');
        const bsModal = new bootstrap.Modal(modalEl);
        bsModal.show();
        
        // Clean up when modal is hidden
        modalEl.addEventListener('hidden.bs.modal', () => {
          modalEl.remove();
        });
      } else {
        this.showError('No se pudo cargar los detalles de la importación');
      }
    } catch (error) {
      console.error('Error loading import details:', error);
      this.showError('Error al cargar los detalles de la importación');
    } finally {
      this.hideLoading();
    }
  }

  async downloadFailedRecords(importId) {
    try {
      this.showLoading();
      const response = await apiManager.get(`/import/${importId}/failed-records`);
      
      if (response.success && response.data) {
        const failedRecords = response.data;
        
        if (failedRecords.length === 0) {
          this.showError('No hay registros fallidos para descargar');
          return;
        }
        
        // Convert to CSV with error information
        const headers = ['registro', 'error', 'nombre', 'email', 'telefono', 'provincia', 'empresa', 'notas'];
        const csvContent = [
          headers.join(','),
          ...failedRecords.map((record, index) => 
            [
              index + 1,
              record.error || '',
              record.nombre || '',
              record.email || '',
              record.telefono || '',
              record.provincia || '',
              record.empresa || '',
              record.notas || ''
            ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
          )
        ].join('\n');

        // Create and download file
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `errores_importacion_${importId}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showToast('Éxito', 'Archivo de errores descargado correctamente', 'success');
      } else {
        this.showError('No se pudo descargar el archivo de errores');
      }
    } catch (error) {
      console.error('Error downloading failed records:', error);
      this.showError('Error al descargar el archivo de errores');
    } finally {
      this.hideLoading();
    }
  }

  async clearImportHistory() {
    if (!confirm('¿Estás seguro de que quieres limpiar todo el historial de importaciones?')) {
      return;
    }
    
    try {
      this.showLoading();
      const response = await apiManager.delete('/import/history');
      
      if (response.success) {
        this.showToast('Éxito', 'Historial de importaciones limpiado', 'success');
        this.loadImportTool(); // Refresh the view
      } else {
        this.showError(response.message || 'Error al limpiar el historial');
      }
    } catch (error) {
      console.error('Error clearing import history:', error);
      this.showError('Error al limpiar el historial');
    } finally {
      this.hideLoading();
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔧 DOM loaded, initializing CRM App...');
  // Make app globally accessible
  window.crmApp = new CRMApp();
  window.app = window.crmApp;
});

// Global functions for buttons
function showImportModal() {
  alert('Función de importación en desarrollo');
}

function showCreateUserModal() {
  // Usar el dashboardManager si está disponible
  if (typeof dashboardManager !== 'undefined') {
    dashboardManager.showCreateSellerModal();
  } else {
    alert('Dashboard manager no disponible');
  }
}