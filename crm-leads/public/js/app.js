// Main Application Controller
class CRMApp {
  constructor() {
    this.currentView = null;
    this.isLoading = false;
    
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
    console.log('🚀 Initializing CRM Application...');
    
    try {
      // Setup event listeners first
      this.setupEventListeners();
      
      // Show loading
      this.showLoading();
      
      // Small delay to ensure UI is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if user is already authenticated
      const isAuthenticated = await authManager.verifySession();
      
      if (isAuthenticated) {
        console.log('✅ User authenticated, showing dashboard');
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

  showDashboard() {
    if (!authManager.isAuthenticated()) {
      this.showLogin();
      return;
    }

    this.currentView = 'dashboard';
    
    // Hide loading spinner
    this.hideLoading();
    
    // Show/hide appropriate containers
    this.loginContainer.style.display = 'none';
    this.dashboardContainer.style.display = 'block';
    this.userDropdown.style.display = 'block';
    
    // Update user info in navbar
    const user = authManager.getCurrentUser();
    if (this.userName && user) {
      this.userName.textContent = user.name;
    }

    // Setup navigation menu based on role
    this.setupNavigation(user);
    
    // Load dashboard content
    this.loadDashboardContent();

    console.log('📊 Showing dashboard view for:', user.role);
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
    // Admin navigation
    const dashboardLink = document.getElementById('dashboardLink');
    if (dashboardLink) {
      dashboardLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadDashboardContent();
      });
    }

    const leadsLink = document.getElementById('leadsLink');
    if (leadsLink) {
      leadsLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadLeadsContent();
      });
    }

    const usersLink = document.getElementById('usersLink');
    if (usersLink) {
      usersLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadSellersContent();
      });
    }

    const importLink = document.getElementById('importLink');
    if (importLink) {
      importLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.loadImportContent();
      });
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
      const response = await apiClient.get('/users/stats/dashboard');
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

  async loadLeadsContent() {
    console.log('📋 Loading leads content...');
    const user = authManager.getCurrentUser();
    if (!user) return;

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

      <!-- Statistics Cards -->
      <div class="row mb-4" id="leadsStats">
        <!-- Stats will be populated here -->
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
      </div>
    `;

    this.dashboardContainer.innerHTML = leadsHTML;
    
    // Initialize leads system
    await this.initializeLeadsSystem();
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
      const response = await apiClient.get('/users/sellers');
      if (response.success) {
        this.allSellers = response.data;
        this.populateSellerFilters();
      }
    } catch (error) {
      console.error('Error loading sellers:', error);
    }
  }

  async loadProvinces() {
    try {
      const response = await apiClient.get('/leads/provinces-with-unassigned');
      if (response.success) {
        this.allProvinces = response.data;
        this.populateProvinceFilter();
      }
    } catch (error) {
      console.error('Error loading provinces:', error);
    }
  }

  populateSellerFilters() {
    const sellerFilter = document.getElementById('sellerFilter');
    const assignSeller = document.getElementById('assignSeller');
    
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
  }

  populateProvinceFilter() {
    const provinceFilter = document.getElementById('provinceFilter');
    if (provinceFilter && this.allProvinces && Array.isArray(this.allProvinces)) {
      this.allProvinces.forEach(province => {
        const option = document.createElement('option');
        option.value = province._id;
        option.textContent = `${province._id} (${province.count})`;
        provinceFilter.appendChild(option);
      });
    }
  }

  async loadLeadsStats() {
    try {
      const response = await apiClient.get('/leads/stats');
      if (response.success) {
        this.renderLeadsStats(response.data);
      }
    } catch (error) {
      console.error('Error loading leads stats:', error);
    }
  }

  renderLeadsStats(stats) {
    const leadsStats = document.getElementById('leadsStats');
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

  async loadLeadsData(page = 1) {
    try {
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...this.currentFilters
      });

      const response = await apiClient.get(`/leads?${params}`);
      if (response.success) {
        this.renderLeadsTable(response.data.leads);
        this.renderPagination(response.data.pagination);
        this.updateLeadsCount(response.data.pagination.total);
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

    this.dashboardContainer.innerHTML = importHTML;
    
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
      this.loadingSpinner.style.display = 'flex';
    }
  }

  hideLoading() {
    this.isLoading = false;
    console.log('🔄 Hiding loading spinner...');
    
    if (this.loadingSpinner) {
      this.loadingSpinner.style.display = 'none';
      console.log('✅ Loading spinner hidden');
    } else {
      console.error('❌ Loading spinner element not found');
    }
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
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔧 DOM loaded, initializing CRM App...');
  window.crmApp = new CRMApp();
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