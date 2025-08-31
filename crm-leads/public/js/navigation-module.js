/**
 * NavigationModule - Modular Navigation System
 * Handles tab switching, progressive loading, and navigation state
 */

class NavigationModule extends ComponentBase {
  constructor(options = {}) {
    super({
      name: 'NavigationModule',
      version: '2.0.0',
      ...options
    });

    this.activeModules = new Map();
    this.loadingPromises = new Map();
    this.navigationHistory = [];
  }

  async onInit() {
    console.log('🧭 Initializing NavigationModule');
    
    this.setupNavigationSubscriptions();
    this.setupNavigationEventListeners();
    this.renderNavigationUI();
    
    // Load initial tab
    const currentTab = this.getState('navigation.currentTab') || 'dashboard';
    await this.switchToTab(currentTab);
  }

  setupNavigationSubscriptions() {
    // Subscribe to navigation state changes
    this.subscribe('navigation.currentTab', (tab) => {
      this.updateActiveTab(tab);
    });

    this.subscribe('navigation.isLoading', (isLoading) => {
      this.updateLoadingState(isLoading);
    });

    this.subscribe('navigation.loadedTabs', (loadedTabs) => {
      this.updateTabStatus(loadedTabs);
    });
  }

  setupNavigationEventListeners() {
    // Handle tab clicks
    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('nav-tab')) {
        event.preventDefault();
        const tab = event.target.dataset.tab;
        if (tab) {
          this.switchToTab(tab);
        }
      }
    });

    // Handle back/forward navigation
    window.addEventListener('popstate', (event) => {
      if (event.state && event.state.tab) {
        this.switchToTab(event.state.tab, false);
      }
    });
  }

  renderNavigationUI() {
    if (!this.container) return;

    const currentTab = this.getState('navigation.currentTab') || 'dashboard';
    
    const html = `
      <nav class="navigation-module">
        <div class="nav-tabs">
          <button class="nav-tab ${currentTab === 'dashboard' ? 'active' : ''}" 
                  data-tab="dashboard">
            <i class="icon-dashboard"></i>
            <span>Dashboard</span>
            <div class="tab-loader" style="display: none;"></div>
          </button>
          
          <button class="nav-tab ${currentTab === 'leads' ? 'active' : ''}" 
                  data-tab="leads">
            <i class="icon-leads"></i>
            <span>Leads</span>
            <div class="tab-loader" style="display: none;"></div>
          </button>
          
          <button class="nav-tab ${currentTab === 'import' ? 'active' : ''}" 
                  data-tab="import">
            <i class="icon-import"></i>
            <span>Import</span>
            <div class="tab-loader" style="display: none;"></div>
          </button>
          
          <button class="nav-tab ${currentTab === 'sellers' ? 'active' : ''}" 
                  data-tab="sellers">
            <i class="icon-users"></i>
            <span>Sellers</span>
            <div class="tab-loader" style="display: none;"></div>
          </button>
          
          <button class="nav-tab ${currentTab === 'settings' ? 'active' : ''}" 
                  data-tab="settings">
            <i class="icon-settings"></i>
            <span>Settings</span>
            <div class="tab-loader" style="display: none;"></div>
          </button>
        </div>

        <!-- Tab Content Container -->
        <div id="mainContent" class="main-content">
          <!-- Content will be loaded here -->
        </div>

        <!-- Navigation Status -->
        <div class="nav-status" style="display: none;">
          <div class="status-message"></div>
          <div class="status-progress">
            <div class="progress-bar"></div>
          </div>
        </div>
      </nav>
    `;

    super.render(html);
  }

  async switchToTab(tabName, updateHistory = true) {
    try {
      console.log(`🧭 Switching to tab: ${tabName}`);
      
      // Prevent switching to same tab
      const currentTab = this.getState('navigation.currentTab');
      if (currentTab === tabName && this.activeModules.has(tabName)) {
        return;
      }

      // Update navigation state
      this.setState('navigation.isLoading', true);
      
      // Show tab loader
      this.showTabLoader(tabName);
      
      // Update active tab immediately for UI responsiveness
      this.setState('navigation.currentTab', tabName);
      
      // Update history
      if (updateHistory) {
        this.updateNavigationHistory(tabName);
        history.pushState({ tab: tabName }, '', `#${tabName}`);
      }

      // Load tab content
      await this.loadTabContent(tabName);
      
      // Mark tab as loaded
      const loadedTabs = this.getState('navigation.loadedTabs') || new Set();
      loadedTabs.add(tabName);
      this.setState('navigation.loadedTabs', loadedTabs);
      
      this.setState('navigation.isLoading', false);
      this.hideTabLoader(tabName);
      
      console.log(`✅ Successfully switched to tab: ${tabName}`);
      
    } catch (error) {
      this.handleError(error, `switching to tab ${tabName}`);
      this.setState('navigation.isLoading', false);
      this.hideTabLoader(tabName);
    }
  }

  async loadTabContent(tabName) {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) {
      throw new Error('Main content container not found');
    }

    // Check if we already have a loading promise for this tab
    if (this.loadingPromises.has(tabName)) {
      return await this.loadingPromises.get(tabName);
    }

    // Create loading promise
    const loadingPromise = this.createTabContent(tabName, mainContent);
    this.loadingPromises.set(tabName, loadingPromise);

    try {
      await loadingPromise;
    } finally {
      this.loadingPromises.delete(tabName);
    }
  }

  async createTabContent(tabName, container) {
    // Destroy existing active module if different
    const currentActive = this.getState('navigation.currentTab');
    if (currentActive && currentActive !== tabName && this.activeModules.has(currentActive)) {
      const existingModule = this.activeModules.get(currentActive);
      await existingModule.destroy();
      this.activeModules.delete(currentActive);
    }

    switch (tabName) {
      case 'dashboard':
        await this.loadDashboardTab(container);
        break;
      
      case 'leads':
        await this.loadLeadsTab(container);
        break;
      
      case 'import':
        await this.loadImportTab(container);
        break;
      
      case 'sellers':
        await this.loadSellersTab(container);
        break;
      
      case 'settings':
        await this.loadSettingsTab(container);
        break;
      
      default:
        throw new Error(`Unknown tab: ${tabName}`);
    }
  }

  async loadDashboardTab(container) {
    console.log('📊 Loading Dashboard tab');
    
    // Show skeleton while loading
    container.innerHTML = this.getDashboardSkeleton();
    
    try {
      // Load dashboard stats in batch
      const requests = [
        '/leads/stats',
        '/users/stats/dashboard'
      ];

      const results = await this.batchApiCalls(requests);
      
      // Process results
      let leadsStats = {};
      let usersStats = {};

      if (results[0].status === 'fulfilled') {
        leadsStats = results[0].value;
      }

      if (results[1].status === 'fulfilled') {
        usersStats = results[1].value;
      }

      // Render dashboard content
      container.innerHTML = this.getDashboardHTML(leadsStats, usersStats);
      
    } catch (error) {
      container.innerHTML = this.getErrorHTML('Failed to load dashboard', error.message);
    }
  }

  async loadLeadsTab(container) {
    console.log('🎯 Loading Leads tab');
    
    try {
      // Create leads module if not exists
      if (!this.activeModules.has('leads')) {
        const leadsModule = window.componentRegistry.create('LeadsModule', {
          container: container
        });
        
        await leadsModule.init();
        this.activeModules.set('leads', leadsModule);
      }

      // Render the module
      const leadsModule = this.activeModules.get('leads');
      leadsModule.render();
      
    } catch (error) {
      container.innerHTML = this.getErrorHTML('Failed to load leads', error.message);
    }
  }

  async loadImportTab(container) {
    console.log('📤 Loading Import tab');
    
    container.innerHTML = this.getImportSkeleton();
    
    try {
      // Simulate loading delay for import functionality
      await this.sleep(500);
      
      container.innerHTML = this.getImportHTML();
      
    } catch (error) {
      container.innerHTML = this.getErrorHTML('Failed to load import', error.message);
    }
  }

  async loadSellersTab(container) {
    console.log('👥 Loading Sellers tab');
    
    container.innerHTML = this.getSellersSkeleton();
    
    try {
      const response = await this.apiCall('/users/sellers');
      const sellersData = response.data?.sellers || response || [];
      container.innerHTML = this.getSellersHTML(sellersData);
      
    } catch (error) {
      container.innerHTML = this.getErrorHTML('Failed to load sellers', error.message);
    }
  }

  async loadSettingsTab(container) {
    console.log('⚙️ Loading Settings tab');
    
    container.innerHTML = this.getSettingsSkeleton();
    
    try {
      await this.sleep(300);
      container.innerHTML = this.getSettingsHTML();
      
    } catch (error) {
      container.innerHTML = this.getErrorHTML('Failed to load settings', error.message);
    }
  }

  // UI Update methods
  updateActiveTab(tabName) {
    // Remove active class from all tabs
    this.$$('.nav-tab').forEach(tab => tab.classList.remove('active'));
    
    // Add active class to current tab
    const activeTab = this.$(`[data-tab="${tabName}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
    }
  }

  showTabLoader(tabName) {
    const tab = this.$(`[data-tab="${tabName}"]`);
    if (tab) {
      const loader = tab.querySelector('.tab-loader');
      if (loader) {
        loader.style.display = 'block';
      }
      tab.classList.add('loading');
    }
  }

  hideTabLoader(tabName) {
    const tab = this.$(`[data-tab="${tabName}"]`);
    if (tab) {
      const loader = tab.querySelector('.tab-loader');
      if (loader) {
        loader.style.display = 'none';
      }
      tab.classList.remove('loading');
    }
  }

  updateLoadingState(isLoading) {
    const statusElement = this.$('.nav-status');
    if (!statusElement) return;

    if (isLoading) {
      statusElement.style.display = 'block';
      this.$('.status-message').textContent = 'Loading...';
    } else {
      statusElement.style.display = 'none';
    }
  }

  updateNavigationHistory(tabName) {
    this.navigationHistory.push({
      tab: tabName,
      timestamp: Date.now()
    });

    // Keep only last 10 entries
    if (this.navigationHistory.length > 10) {
      this.navigationHistory.shift();
    }

    this.setState('navigation.history', this.navigationHistory);
  }

  // HTML Templates
  getDashboardSkeleton() {
    return `
      <div class="dashboard-skeleton">
        <div class="skeleton-stats">
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
          <div class="skeleton-card"></div>
        </div>
        <div class="skeleton-chart"></div>
      </div>
    `;
  }

  getDashboardHTML(leadsStats, usersStats) {
    return `
      <div class="dashboard-container">
        <h2>Dashboard</h2>
        
        <div class="dashboard-stats">
          <div class="stats-row">
            <div class="stat-card">
              <div class="stat-value">${leadsStats.total || 0}</div>
              <div class="stat-label">Total Leads</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${leadsStats.new || 0}</div>
              <div class="stat-label">New Leads</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${leadsStats.converted || 0}</div>
              <div class="stat-label">Converted</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${usersStats.sellers || 0}</div>
              <div class="stat-label">Active Sellers</div>
            </div>
          </div>
        </div>

        <div class="dashboard-charts">
          <div class="chart-container">
            <h3>Leads by Status</h3>
            <div class="chart-placeholder">Chart will be rendered here</div>
          </div>
        </div>

        <div class="quick-actions">
          <h3>Quick Actions</h3>
          <button class="btn btn-primary" onclick="navigationModule.switchToTab('leads')">
            View All Leads
          </button>
          <button class="btn btn-secondary" onclick="navigationModule.switchToTab('import')">
            Import Leads
          </button>
        </div>
      </div>
    `;
  }

  getImportSkeleton() {
    return `
      <div class="import-skeleton">
        <div class="skeleton-header"></div>
        <div class="skeleton-form">
          <div class="skeleton-field"></div>
          <div class="skeleton-field"></div>
          <div class="skeleton-button"></div>
        </div>
      </div>
    `;
  }

  getImportHTML() {
    return `
      <div class="import-container">
        <h2>Import Leads</h2>
        
        <div class="import-form">
          <div class="form-group">
            <label>Select CSV File</label>
            <input type="file" id="csvFile" accept=".csv" class="form-control">
          </div>
          
          <div class="form-group">
            <label>Import Options</label>
            <div class="checkbox-group">
              <input type="checkbox" id="skipDuplicates" checked>
              <label for="skipDuplicates">Skip duplicates</label>
            </div>
          </div>
          
          <button id="importBtn" class="btn btn-primary">
            Import Leads
          </button>
        </div>

        <div id="importProgress" class="import-progress" style="display: none;">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <div class="progress-text">Importing...</div>
        </div>

        <div id="importResults" class="import-results" style="display: none;">
          <!-- Results will be shown here -->
        </div>
      </div>
    `;
  }

  getSellersSkeleton() {
    return `
      <div class="sellers-skeleton">
        <div class="skeleton-header"></div>
        <div class="skeleton-table">
          <div class="skeleton-row"></div>
          <div class="skeleton-row"></div>
          <div class="skeleton-row"></div>
        </div>
      </div>
    `;
  }

  getSellersHTML(sellers) {
    return `
      <div class="sellers-container">
        <h2>Sellers Management</h2>
        
        <div class="sellers-actions">
          <button class="btn btn-primary" id="addSeller">Add New Seller</button>
        </div>

        <div class="sellers-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Status</th>
                <th>Total Leads</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${sellers.map(seller => `
                <tr>
                  <td>${seller.name || 'N/A'}</td>
                  <td>${seller.username || 'N/A'}</td>
                  <td><span class="status-badge active">Active</span></td>
                  <td>${seller.totalLeads || 0}</td>
                  <td>
                    <button class="btn-small edit-seller" data-seller-id="${seller._id}">Edit</button>
                    <button class="btn-small delete-seller" data-seller-id="${seller._id}">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  getSettingsSkeleton() {
    return `
      <div class="settings-skeleton">
        <div class="skeleton-header"></div>
        <div class="skeleton-form">
          <div class="skeleton-section"></div>
          <div class="skeleton-section"></div>
        </div>
      </div>
    `;
  }

  getSettingsHTML() {
    return `
      <div class="settings-container">
        <h2>Settings</h2>
        
        <div class="settings-sections">
          <div class="settings-section">
            <h3>General Settings</h3>
            <div class="form-group">
              <label>Items per page</label>
              <select class="form-control">
                <option value="25">25</option>
                <option value="50" selected>50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          <div class="settings-section">
            <h3>Notifications</h3>
            <div class="checkbox-group">
              <input type="checkbox" id="emailNotifications" checked>
              <label for="emailNotifications">Email notifications</label>
            </div>
          </div>

          <div class="settings-section">
            <h3>Data Management</h3>
            <button class="btn btn-danger" id="clearCache">Clear Cache</button>
            <button class="btn btn-secondary" id="exportData">Export Data</button>
          </div>
        </div>
      </div>
    `;
  }

  getErrorHTML(title, message) {
    return `
      <div class="error-container">
        <div class="error-icon">❌</div>
        <h3>${title}</h3>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="location.reload()">
          Refresh Page
        </button>
      </div>
    `;
  }

  // Utility methods
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async onDestroy() {
    // Destroy all active modules
    for (const [tabName, module] of this.activeModules) {
      try {
        await module.destroy();
      } catch (error) {
        console.error(`Error destroying module ${tabName}:`, error);
      }
    }
    
    this.activeModules.clear();
    this.loadingPromises.clear();
    
    console.log('🗑️ NavigationModule destroyed');
  }
}

// Register the component
window.componentRegistry.register(NavigationModule, 'NavigationModule');

console.log('🧭 NavigationModule loaded');