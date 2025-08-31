/**
 * LeadsModule - Modular Leads Management Component
 * Handles all leads-related functionality with state management integration
 */

class LeadsModule extends ComponentBase {
  constructor(options = {}) {
    super({
      name: 'LeadsModule',
      version: '2.0.0',
      ...options
    });
    
    this.currentPage = 1;
    this.selectedLeads = new Set();
    this.currentFilters = {};
    this.sortBy = { field: 'createdAt', direction: 'desc' };
  }

  async onInit() {
    console.log('🎯 Initializing LeadsModule');
    
    // Setup state subscriptions
    this.setupLeadsSubscriptions();
    
    // Setup event listeners
    this.setupLeadsEventListeners();
    
    // Load initial data
    await this.loadInitialData();
  }

  setupLeadsSubscriptions() {
    // Subscribe to leads data changes
    this.subscribe('leads.data', (leadsData) => {
      this.renderLeadsList(leadsData);
    });

    // Subscribe to leads stats changes
    this.subscribe('leads.stats', (stats) => {
      this.renderLeadsStats(stats);
    });

    // Subscribe to filter changes
    this.subscribe('leads.filters', (filters) => {
      this.currentFilters = filters;
      this.applyFilters();
    });

    // Subscribe to pagination changes
    this.subscribe('leads.pagination', (pagination) => {
      this.renderPagination(pagination);
    });

    // Subscribe to loading states
    this.subscribe('ui.loading', (loadingStates) => {
      this.handleLoadingStates(loadingStates);
    });
  }

  setupLeadsEventListeners() {
    // Delegation pattern for dynamic content
    document.addEventListener('click', this.handleLeadsClick.bind(this));
    document.addEventListener('change', this.handleLeadsChange.bind(this));
    document.addEventListener('submit', this.handleLeadsSubmit.bind(this));
  }

  async loadInitialData() {
    try {
      console.log('📊 Loading leads initial data...');
      
      // Batch critical requests
      const criticalRequests = [
        '/leads/stats',
        `/leads?page=${this.currentPage}&limit=50`
      ];

      const results = await this.batchApiCalls(criticalRequests);
      
      // Process stats
      if (results[0].status === 'fulfilled') {
        this.setState('leads.stats', results[0].value);
      }

      // Process leads data
      if (results[1].status === 'fulfilled') {
        const leadsResponse = results[1].value;
        this.setState('leads.data', leadsResponse.leads || []);
        this.setState('leads.pagination', {
          page: leadsResponse.page || 1,
          limit: leadsResponse.limit || 50,
          total: leadsResponse.total || 0
        });
      }

      // Load supporting data in background
      this.loadSupportingData();
      
    } catch (error) {
      this.handleError(error, 'loading initial data');
    }
  }

  async loadSupportingData() {
    try {
      const supportRequests = [
        '/users/sellers',
        '/leads/provinces-with-unassigned'
      ];

      const results = await this.batchApiCalls(supportRequests);
      
      // Process sellers
      if (results[0].status === 'fulfilled') {
        this.setState('sellers.data', results[0].value);
      }

      // Process provinces
      if (results[1].status === 'fulfilled') {
        this.setState('leads.provinces', results[1].value);
      }

    } catch (error) {
      console.warn('Failed to load supporting data:', error);
    }
  }

  render() {
    if (!this.container) return;

    const html = `
      <div class="leads-module">
        <!-- Stats Container -->
        <div id="leadsStatsContainer" class="stats-container">
          <!-- Stats will be rendered here -->
        </div>

        <!-- Filters Section -->
        <div class="leads-filters">
          <div class="filter-group">
            <select id="statusFilter" class="form-control">
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
            </select>
          </div>
          
          <div class="filter-group">
            <select id="provinceFilter" class="form-control">
              <option value="">All Provinces</option>
              <!-- Provinces populated dynamically -->
            </select>
          </div>

          <div class="filter-group">
            <select id="sellerFilter" class="form-control">
              <option value="">All Sellers</option>
              <option value="unassigned">Unassigned</option>
              <!-- Sellers populated dynamically -->
            </select>
          </div>

          <div class="filter-group">
            <input type="text" id="searchFilter" placeholder="Search leads..." class="form-control">
          </div>

          <div class="filter-actions">
            <button id="applyFilters" class="btn btn-primary">Filter</button>
            <button id="clearFilters" class="btn btn-secondary">Clear</button>
          </div>
        </div>

        <!-- Bulk Actions -->
        <div class="bulk-actions" style="display: none;">
          <button id="bulkAssign" class="btn btn-primary">Assign Selected</button>
          <button id="bulkExport" class="btn btn-secondary">Export Selected</button>
          <button id="bulkDelete" class="btn btn-danger">Delete Selected</button>
        </div>

        <!-- Leads List Container -->
        <div id="leadsListContainer" class="leads-list-container">
          <!-- Leads list will be rendered here -->
        </div>

        <!-- Pagination Container -->
        <div id="leadsPaginationContainer" class="pagination-container">
          <!-- Pagination will be rendered here -->
        </div>
      </div>
    `;

    super.render(html);
    this.populateFilterOptions();
  }

  renderLeadsStats(stats) {
    const statsContainer = this.$('#leadsStatsContainer');
    if (!statsContainer || !stats) return;

    const html = `
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-value">${stats.total || 0}</div>
          <div class="stat-label">Total Leads</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.new || 0}</div>
          <div class="stat-label">New</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.contacted || 0}</div>
          <div class="stat-label">Contacted</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.converted || 0}</div>
          <div class="stat-label">Converted</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.unassigned || 0}</div>
          <div class="stat-label">Unassigned</div>
        </div>
      </div>
    `;

    statsContainer.innerHTML = html;
  }

  renderLeadsList(leads) {
    const listContainer = this.$('#leadsListContainer');
    if (!listContainer) return;

    if (!leads || leads.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <h3>No leads found</h3>
          <p>Try adjusting your filters or add new leads</p>
        </div>
      `;
      return;
    }

    const html = `
      <div class="leads-table-container">
        <table class="leads-table">
          <thead>
            <tr>
              <th><input type="checkbox" id="selectAll"></th>
              <th data-sort="name">Name</th>
              <th data-sort="email">Email</th>
              <th data-sort="phone">Phone</th>
              <th data-sort="province">Province</th>
              <th data-sort="status">Status</th>
              <th data-sort="seller">Seller</th>
              <th data-sort="createdAt">Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${leads.map(lead => this.renderLeadRow(lead)).join('')}
          </tbody>
        </table>
      </div>
    `;

    listContainer.innerHTML = html;
    this.updateBulkActions();
  }

  renderLeadRow(lead) {
    return `
      <tr data-lead-id="${lead._id}" class="lead-row">
        <td>
          <input type="checkbox" class="lead-checkbox" value="${lead._id}">
        </td>
        <td>
          <div class="lead-name">
            <strong>${lead.name || 'N/A'}</strong>
            ${lead.company ? `<small>${lead.company}</small>` : ''}
          </div>
        </td>
        <td>${lead.email || 'N/A'}</td>
        <td>${lead.phone || 'N/A'}</td>
        <td>${lead.province || 'N/A'}</td>
        <td>
          <span class="status-badge status-${lead.status}">
            ${this.formatStatus(lead.status)}
          </span>
        </td>
        <td>
          ${lead.seller ? `
            <div class="seller-info">
              <strong>${lead.seller.name}</strong>
              <small>${lead.seller.email}</small>
            </div>
          ` : '<span class="unassigned">Unassigned</span>'}
        </td>
        <td>${this.formatDate(lead.createdAt)}</td>
        <td class="actions">
          <button class="btn-small view-lead" data-lead-id="${lead._id}">View</button>
          <button class="btn-small edit-lead" data-lead-id="${lead._id}">Edit</button>
          <button class="btn-small assign-lead" data-lead-id="${lead._id}">Assign</button>
        </td>
      </tr>
    `;
  }

  renderPagination(pagination) {
    const paginationContainer = this.$('#leadsPaginationContainer');
    if (!paginationContainer || !pagination) return;

    const { page, limit, total } = pagination;
    const totalPages = Math.ceil(total / limit);

    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    let html = '<div class="pagination">';
    
    // Previous button
    if (page > 1) {
      html += `<button class="page-btn" data-page="${page - 1}">Previous</button>`;
    }

    // Page numbers
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);

    for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === page ? 'active' : '';
      html += `<button class="page-btn ${activeClass}" data-page="${i}">${i}</button>`;
    }

    // Next button
    if (page < totalPages) {
      html += `<button class="page-btn" data-page="${page + 1}">Next</button>`;
    }

    html += '</div>';
    paginationContainer.innerHTML = html;
  }

  populateFilterOptions() {
    // Populate provinces
    const provinces = this.getState('leads.provinces') || [];
    const provinceFilter = this.$('#provinceFilter');
    if (provinceFilter && provinces.length > 0) {
      provinces.forEach(province => {
        const option = document.createElement('option');
        option.value = province;
        option.textContent = province;
        provinceFilter.appendChild(option);
      });
    }

    // Populate sellers
    const sellers = this.getState('sellers.data') || [];
    const sellerFilter = this.$('#sellerFilter');
    if (sellerFilter && sellers.length > 0) {
      sellers.forEach(seller => {
        const option = document.createElement('option');
        option.value = seller._id;
        option.textContent = `${seller.name} (${seller.email})`;
        sellerFilter.appendChild(option);
      });
    }
  }

  handleLeadsClick(event) {
    const target = event.target;

    // Handle pagination
    if (target.classList.contains('page-btn')) {
      const page = parseInt(target.dataset.page);
      if (page) {
        this.changePage(page);
      }
      return;
    }

    // Handle sorting
    if (target.hasAttribute('data-sort')) {
      const field = target.dataset.sort;
      this.toggleSort(field);
      return;
    }

    // Handle select all checkbox
    if (target.id === 'selectAll') {
      this.toggleSelectAll(target.checked);
      return;
    }

    // Handle individual lead checkboxes
    if (target.classList.contains('lead-checkbox')) {
      this.toggleLeadSelection(target.value, target.checked);
      return;
    }

    // Handle lead actions
    if (target.classList.contains('view-lead')) {
      this.viewLead(target.dataset.leadId);
      return;
    }

    if (target.classList.contains('edit-lead')) {
      this.editLead(target.dataset.leadId);
      return;
    }

    if (target.classList.contains('assign-lead')) {
      this.assignLead(target.dataset.leadId);
      return;
    }

    // Handle filter buttons
    if (target.id === 'applyFilters') {
      this.applyFilters();
      return;
    }

    if (target.id === 'clearFilters') {
      this.clearFilters();
      return;
    }

    // Handle bulk actions
    if (target.id === 'bulkAssign') {
      this.bulkAssignLeads();
      return;
    }

    if (target.id === 'bulkExport') {
      this.bulkExportLeads();
      return;
    }

    if (target.id === 'bulkDelete') {
      this.bulkDeleteLeads();
      return;
    }
  }

  handleLeadsChange(event) {
    const target = event.target;

    // Handle search filter with debounce
    if (target.id === 'searchFilter') {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.applyFilters();
      }, 500);
    }
  }

  handleLeadsSubmit(event) {
    // Handle any form submissions in leads module
    if (event.target.closest('.leads-module')) {
      event.preventDefault();
    }
  }

  async applyFilters() {
    const filters = {
      status: this.$('#statusFilter')?.value || '',
      province: this.$('#provinceFilter')?.value || '',
      seller: this.$('#sellerFilter')?.value || '',
      search: this.$('#searchFilter')?.value || ''
    };

    this.currentFilters = filters;
    this.setState('leads.filters', filters);

    // Build query parameters
    const params = new URLSearchParams({
      page: '1',
      limit: '50',
      ...filters,
      sortBy: this.sortBy.field,
      sortDirection: this.sortBy.direction
    });

    // Remove empty values
    for (const [key, value] of params) {
      if (!value) params.delete(key);
    }

    try {
      const response = await this.apiCall(`/leads?${params.toString()}`);
      
      this.setState('leads.data', response.leads || []);
      this.setState('leads.pagination', {
        page: response.page || 1,
        limit: response.limit || 50,
        total: response.total || 0
      });

    } catch (error) {
      this.handleError(error, 'applying filters');
    }
  }

  clearFilters() {
    // Reset filter inputs
    const filterInputs = this.$$('.leads-filters input, .leads-filters select');
    filterInputs.forEach(input => {
      input.value = '';
    });

    // Reset internal state
    this.currentFilters = {};
    this.setState('leads.filters', {});

    // Reload data without filters
    this.loadInitialData();
  }

  async changePage(page) {
    this.currentPage = page;
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '50',
      ...this.currentFilters,
      sortBy: this.sortBy.field,
      sortDirection: this.sortBy.direction
    });

    try {
      const response = await this.apiCall(`/leads?${params.toString()}`);
      
      this.setState('leads.data', response.leads || []);
      this.setState('leads.pagination', {
        page: response.page || page,
        limit: response.limit || 50,
        total: response.total || 0
      });

    } catch (error) {
      this.handleError(error, 'changing page');
    }
  }

  toggleSort(field) {
    if (this.sortBy.field === field) {
      this.sortBy.direction = this.sortBy.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy.field = field;
      this.sortBy.direction = 'asc';
    }

    // Update UI
    this.$$('[data-sort]').forEach(th => th.classList.remove('sort-asc', 'sort-desc'));
    this.$(`[data-sort="${field}"]`)?.classList.add(`sort-${this.sortBy.direction}`);

    // Apply sort
    this.applyFilters();
  }

  toggleSelectAll(checked) {
    const checkboxes = this.$$('.lead-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = checked;
      this.toggleLeadSelection(checkbox.value, checked);
    });
  }

  toggleLeadSelection(leadId, selected) {
    if (selected) {
      this.selectedLeads.add(leadId);
    } else {
      this.selectedLeads.delete(leadId);
    }

    this.updateBulkActions();
    this.setState('leads.selectedIds', this.selectedLeads);
  }

  updateBulkActions() {
    const bulkActions = this.$('.bulk-actions');
    if (!bulkActions) return;

    if (this.selectedLeads.size > 0) {
      bulkActions.style.display = 'block';
    } else {
      bulkActions.style.display = 'none';
    }
  }

  // Action methods
  viewLead(leadId) {
    this.setState('ui.modals.leadDetail', true);
    this.emit('leadAction', { action: 'view', leadId });
  }

  editLead(leadId) {
    this.emit('leadAction', { action: 'edit', leadId });
  }

  assignLead(leadId) {
    this.setState('ui.modals.assignLead', true);
    this.emit('leadAction', { action: 'assign', leadId });
  }

  bulkAssignLeads() {
    if (this.selectedLeads.size === 0) return;
    
    this.setState('ui.modals.assignLead', true);
    this.emit('leadAction', { action: 'bulkAssign', leadIds: Array.from(this.selectedLeads) });
  }

  bulkExportLeads() {
    if (this.selectedLeads.size === 0) return;
    
    this.emit('leadAction', { action: 'bulkExport', leadIds: Array.from(this.selectedLeads) });
  }

  bulkDeleteLeads() {
    if (this.selectedLeads.size === 0) return;
    
    if (confirm(`Delete ${this.selectedLeads.size} selected leads?`)) {
      this.emit('leadAction', { action: 'bulkDelete', leadIds: Array.from(this.selectedLeads) });
    }
  }

  // Utility methods
  formatStatus(status) {
    const statusLabels = {
      new: 'New',
      contacted: 'Contacted',
      qualified: 'Qualified',
      converted: 'Converted'
    };
    return statusLabels[status] || status;
  }

  handleLoadingStates(loadingStates) {
    // Handle various loading states
    if (loadingStates.leads_loading) {
      this.showLoadingSkeleton('Loading leads...');
    }
  }

  async onDestroy() {
    // Clear any timeouts
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Clear selections
    this.selectedLeads.clear();
    
    console.log('🗑️ LeadsModule destroyed');
  }
}

// Register the component
window.componentRegistry.register(LeadsModule, 'LeadsModule');

console.log('🎯 LeadsModule loaded');