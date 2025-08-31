// Dashboard Management Module
class DashboardManager {
  constructor() {
    this.currentPeriod = 'month';
    this.currentSellerId = null;
    this.refreshInterval = null;
  }

  // ========== LEAD DISTRIBUTION SYSTEM ==========
  
  async showLeadDistributionModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'leadDistributionModal';
    modal.setAttribute('tabindex', '-1');
    
    modal.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-people-fill me-2"></i>Distribución de Leads
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <!-- Distribution Form -->
            <form id="distributionForm">
              <div class="row mb-4">
                <div class="col-md-6">
                  <label class="form-label">Estrategia de Distribución</label>
                  <select class="form-select" id="distributionStrategy" required>
                    <option value="">Seleccionar estrategia...</option>
                    <option value="equitativo">Distribución Equitativa</option>
                    <option value="regional">Distribución Regional</option>
                    <option value="performance">Basada en Performance</option>
                    <option value="manual">Asignación Manual</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Cantidad de Leads</label>
                  <input type="number" class="form-control" id="leadsQuantity" min="1" max="1000" value="50" required>
                </div>
              </div>

              <!-- Seller Selection -->
              <div class="row mb-4">
                <div class="col-12">
                  <label class="form-label">Vendedores Seleccionados</label>
                  <div class="row" id="sellerCheckboxes">
                    <!-- Populated dynamically -->
                  </div>
                </div>
              </div>

              <!-- Filters -->
              <div class="row mb-4">
                <div class="col-md-4">
                  <label class="form-label">Filtrar por Estado</label>
                  <select class="form-select" id="statusFilter">
                    <option value="">Todos los estados</option>
                    <option value="uncontacted">Sin contactar</option>
                    <option value="contacted">Contactado</option>
                    <option value="interested">Interesado</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Filtrar por Provincia</label>
                  <select class="form-select" id="provinceFilter">
                    <option value="">Todas las provincias</option>
                    <!-- Populated dynamically -->
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Solo No Asignados</label>
                  <div class="form-check form-switch mt-2">
                    <input class="form-check-input" type="checkbox" id="unassignedOnly" checked>
                    <label class="form-check-label">Solo leads sin asignar</label>
                  </div>
                </div>
              </div>

              <!-- Preview Section -->
              <div class="card mb-3" id="distributionPreview" style="display: none;">
                <div class="card-header">
                  <h6><i class="bi bi-eye me-2"></i>Vista Previa de Distribución</h6>
                </div>
                <div class="card-body" id="previewContent">
                  <!-- Preview content will be populated here -->
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-info" id="previewDistributionBtn">
              <i class="bi bi-eye me-1"></i>Vista Previa
            </button>
            <button type="submit" class="btn btn-primary" form="distributionForm">
              <i class="bi bi-check me-1"></i>Ejecutar Distribución
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    // Initialize modal
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();

    // Clean up modal when hidden
    modal.addEventListener('hidden.bs.modal', () => {
      document.body.removeChild(modal);
    });

    // Load seller data and setup event listeners
    await this.initializeDistributionModal();
  }

  async initializeDistributionModal() {
    try {
      // Load sellers for checkbox selection
      const sellersResponse = await apiClient.get('/users/sellers');
      if (sellersResponse.success) {
        this.populateSellerCheckboxes(sellersResponse.data);
      }

      // Load provinces for filtering
      const provincesResponse = await apiClient.get('/leads/provinces-with-unassigned');
      if (provincesResponse.success) {
        this.populateProvinceFilter(provincesResponse.data);
      }

      // Setup event listeners
      this.setupDistributionEventListeners();

    } catch (error) {
      console.error('Error initializing distribution modal:', error);
    }
  }

  populateSellerCheckboxes(sellers) {
    const container = document.getElementById('sellerCheckboxes');
    if (!container) return;

    if (!sellers || !Array.isArray(sellers)) {
      console.error('Sellers data is not an array:', sellers);
      container.innerHTML = '<p class="text-muted">No hay vendedores disponibles</p>';
      return;
    }

    container.innerHTML = sellers.map(seller => `
      <div class="col-md-4 col-sm-6 mb-2">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" value="${seller._id}" id="seller_${seller._id}">
          <label class="form-check-label" for="seller_${seller._id}">
            ${seller.name}
            <small class="text-muted d-block">Leads: ${seller.totalLeads || 0}</small>
          </label>
        </div>
      </div>
    `).join('');

    // Add "Select All" functionality
    const selectAllHtml = `
      <div class="col-12 mb-3">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="selectAllSellers">
          <label class="form-check-label" for="selectAllSellers">
            <strong>Seleccionar Todos</strong>
          </label>
        </div>
        <hr>
      </div>
    `;
    container.insertAdjacentHTML('afterbegin', selectAllHtml);

    // Setup select all functionality
    document.getElementById('selectAllSellers').addEventListener('change', (e) => {
      const checkboxes = container.querySelectorAll('input[type="checkbox"]:not(#selectAllSellers)');
      checkboxes.forEach(cb => cb.checked = e.target.checked);
    });
  }

  populateProvinceFilter(provinces) {
    const select = document.getElementById('provinceFilter');
    if (!select) return;

    provinces.forEach(province => {
      const option = document.createElement('option');
      option.value = province._id;
      option.textContent = `${province._id} (${province.count} leads)`;
      select.appendChild(option);
    });
  }

  setupDistributionEventListeners() {
    const form = document.getElementById('distributionForm');
    const previewBtn = document.getElementById('previewDistributionBtn');
    const strategySelect = document.getElementById('distributionStrategy');

    // Preview functionality
    if (previewBtn) {
      previewBtn.addEventListener('click', () => this.showDistributionPreview());
    }

    // Form submission
    if (form) {
      form.addEventListener('submit', (e) => this.handleDistributionSubmit(e));
    }

    // Strategy change handler
    if (strategySelect) {
      strategySelect.addEventListener('change', (e) => this.handleStrategyChange(e.target.value));
    }
  }

  handleStrategyChange(strategy) {
    const sellerCheckboxes = document.getElementById('sellerCheckboxes');
    const quantityInput = document.getElementById('leadsQuantity');

    switch (strategy) {
      case 'equitativo':
        // Enable all sellers by default
        document.getElementById('selectAllSellers').checked = true;
        document.getElementById('selectAllSellers').dispatchEvent(new Event('change'));
        break;
      case 'regional':
        // Show hint about regional distribution
        this.showStrategyHint('Se asignarán leads a vendedores de la misma provincia cuando sea posible');
        break;
      case 'performance':
        // Show hint about performance-based distribution
        this.showStrategyHint('Se asignarán más leads a vendedores con mejor tasa de conversión');
        break;
      case 'manual':
        // Show manual assignment options
        this.showStrategyHint('Selecciona manualmente qué vendedores recibirán leads');
        break;
    }
  }

  showStrategyHint(message) {
    // Show a temporary hint message
    const existingHint = document.getElementById('strategyHint');
    if (existingHint) existingHint.remove();

    const hint = document.createElement('div');
    hint.id = 'strategyHint';
    hint.className = 'alert alert-info alert-dismissible fade show mt-2';
    hint.innerHTML = `
      <i class="bi bi-info-circle me-2"></i>${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.getElementById('distributionStrategy').closest('.col-md-6').appendChild(hint);
  }

  async showDistributionPreview() {
    const formData = this.getDistributionFormData();
    if (!formData.isValid) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const previewBtn = document.getElementById('previewDistributionBtn');
      previewBtn.disabled = true;
      previewBtn.innerHTML = '<div class="spinner-border spinner-border-sm me-2"></div>Cargando...';

      // Simulate preview calculation (in real implementation, this would call the API)
      const preview = await this.calculateDistributionPreview(formData);
      this.renderDistributionPreview(preview);

    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Error generando vista previa');
    } finally {
      const previewBtn = document.getElementById('previewDistributionBtn');
      previewBtn.disabled = false;
      previewBtn.innerHTML = '<i class="bi bi-eye me-1"></i>Vista Previa';
    }
  }

  async calculateDistributionPreview(formData) {
    const { strategy, quantity, selectedSellers, criteria } = formData;
    
    // Get current stats for selected sellers
    const sellersResponse = await apiClient.get('/users/sellers');
    const allSellers = sellersResponse.data;
    const selectedSellerData = allSellers.filter(s => selectedSellers.includes(s._id));

    let distribution = [];

    switch (strategy) {
      case 'equitativo':
        const perSeller = Math.floor(quantity / selectedSellers.length);
        const remainder = quantity % selectedSellers.length;
        
        distribution = selectedSellerData.map((seller, index) => ({
          sellerId: seller._id,
          sellerName: seller.name,
          currentLeads: seller.totalLeads || 0,
          newLeads: perSeller + (index < remainder ? 1 : 0),
          totalAfter: (seller.totalLeads || 0) + perSeller + (index < remainder ? 1 : 0)
        }));
        break;

      case 'regional':
        // Simulate regional distribution
        distribution = selectedSellerData.map(seller => ({
          sellerId: seller._id,
          sellerName: seller.name,
          currentLeads: seller.totalLeads || 0,
          newLeads: Math.floor(Math.random() * quantity) + 1, // Simulated
          totalAfter: (seller.totalLeads || 0) + Math.floor(Math.random() * quantity) + 1,
          region: 'Buenos Aires' // Would be calculated based on leads data
        }));
        break;

      case 'performance':
        // Simulate performance-based distribution
        distribution = selectedSellerData.map(seller => {
          const performanceScore = Math.random(); // Would be calculated from actual performance
          const allocatedLeads = Math.floor(quantity * performanceScore * 0.3) + Math.floor(quantity / selectedSellers.length);
          return {
            sellerId: seller._id,
            sellerName: seller.name,
            currentLeads: seller.totalLeads || 0,
            newLeads: allocatedLeads,
            totalAfter: (seller.totalLeads || 0) + allocatedLeads,
            performance: (performanceScore * 100).toFixed(1) + '%'
          };
        });
        break;

      default:
        distribution = selectedSellerData.map(seller => ({
          sellerId: seller._id,
          sellerName: seller.name,
          currentLeads: seller.totalLeads || 0,
          newLeads: 0,
          totalAfter: seller.totalLeads || 0
        }));
    }

    return { strategy, distribution, totalLeads: quantity };
  }

  renderDistributionPreview(preview) {
    const previewCard = document.getElementById('distributionPreview');
    const previewContent = document.getElementById('previewContent');
    
    if (!previewCard || !previewContent) return;

    let tableRows = preview.distribution.map(item => `
      <tr>
        <td>${item.sellerName}</td>
        <td class="text-center">${item.currentLeads}</td>
        <td class="text-center text-primary"><strong>+${item.newLeads}</strong></td>
        <td class="text-center"><strong>${item.totalAfter}</strong></td>
        ${preview.strategy === 'performance' ? `<td class="text-center">${item.performance}</td>` : ''}
        ${preview.strategy === 'regional' ? `<td class="text-center">${item.region}</td>` : ''}
      </tr>
    `).join('');

    previewContent.innerHTML = `
      <div class="table-responsive">
        <table class="table table-sm">
          <thead class="table-light">
            <tr>
              <th>Vendedor</th>
              <th class="text-center">Leads Actuales</th>
              <th class="text-center">Nuevos Leads</th>
              <th class="text-center">Total Después</th>
              ${preview.strategy === 'performance' ? '<th class="text-center">Performance</th>' : ''}
              ${preview.strategy === 'regional' ? '<th class="text-center">Región</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
      <div class="row mt-3">
        <div class="col-md-6">
          <div class="card bg-light">
            <div class="card-body text-center">
              <h5 class="card-title">${preview.totalLeads}</h5>
              <p class="card-text mb-0">Leads a Distribuir</p>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card bg-primary text-white">
            <div class="card-body text-center">
              <h5 class="card-title">${preview.distribution.length}</h5>
              <p class="card-text mb-0">Vendedores Participando</p>
            </div>
          </div>
        </div>
      </div>
    `;

    previewCard.style.display = 'block';
  }

  getDistributionFormData() {
    const strategy = document.getElementById('distributionStrategy')?.value;
    const quantity = parseInt(document.getElementById('leadsQuantity')?.value) || 0;
    const selectedSellers = Array.from(document.querySelectorAll('#sellerCheckboxes input[type="checkbox"]:checked:not(#selectAllSellers)')).map(cb => cb.value);
    
    const criteria = {
      status: document.getElementById('statusFilter')?.value || '',
      province: document.getElementById('provinceFilter')?.value || '',
      unassignedOnly: document.getElementById('unassignedOnly')?.checked || false
    };

    const isValid = strategy && quantity > 0 && selectedSellers.length > 0;

    return { strategy, quantity, selectedSellers, criteria, isValid };
  }

  async handleDistributionSubmit(e) {
    e.preventDefault();
    
    const formData = this.getDistributionFormData();
    if (!formData.isValid) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="spinner-border spinner-border-sm me-2"></div>Ejecutando...';

      const response = await apiClient.post('/leads/bulk-assign', {
        strategy: formData.strategy,
        quantity: formData.quantity,
        userIds: formData.selectedSellers,
        criteria: formData.criteria
      });

      if (response.success) {
        alert(`✅ Distribución completada: ${response.data.assignedCount} leads asignados`);
        
        // Close modal and refresh dashboard
        const modal = bootstrap.Modal.getInstance(document.getElementById('leadDistributionModal'));
        modal.hide();
        
        // Refresh dashboard data
        await this.loadGeneralStats();
        await this.loadSellersOverview();
        
      } else {
        alert('Error en la distribución: ' + response.message);
      }

    } catch (error) {
      console.error('Error ejecutando distribución:', error);
      alert('Error ejecutando la distribución');
    }
  }

  // ========== DASHBOARD TEMPORAL ==========
  
  async loadTemporalDashboard() {
    const user = authManager.getCurrentUser();
    if (!user) return;

    if (user.role === 'admin') {
      await this.loadAdminDashboard();
    } else {
      await this.loadSellerDashboard();
    }
  }

  async loadAdminDashboard() {
    try {
      // Actualizar último acceso
      await this.updateLastAccess();
      
      // Cargar estadísticas generales
      await this.loadGeneralStats();
      
      // Cargar lista de vendedores con stats detalladas
      await this.loadSellersOverview();
      
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
      this.showError('Error al cargar el dashboard');
    }
  }

  async loadSellerDashboard() {
    try {
      const user = authManager.getCurrentUser();
      
      // Actualizar último acceso
      await this.updateLastAccess();
      
      // Cargar mis estadísticas
      await this.loadMyStats(user._id);
      
      // Cargar mis leads recientes
      await this.loadMyRecentLeads(user._id);
      
    } catch (error) {
      console.error('Error loading seller dashboard:', error);
      this.showError('Error al cargar el dashboard');
    }
  }

  async loadGeneralStats() {
    const response = await apiClient.get('/users/stats/dashboard');
    if (response.success) {
      const stats = response.data;
      
      // Actualizar elementos del DOM
      this.updateElement('totalLeads', stats.overview.totalLeads);
      this.updateElement('activeSellers', stats.overview.activeSellers);
      this.updateElement('unassignedLeads', stats.overview.unassignedLeads);
      this.updateElement('totalSellers', stats.overview.totalSellers);
    }
  }

  async loadSellersOverview() {
    try {
      const response = await apiClient.get('/users/sellers');
      if (response.success && response.data.sellers) {
        const sellersContainer = document.getElementById('sellersOverview');
        if (!sellersContainer) {
          // Crear contenedor si no existe
          const dashboardContainer = document.getElementById('dashboardContainer');
          if (dashboardContainer) {
            dashboardContainer.insertAdjacentHTML('beforeend', '<div id="sellersOverview" class="mt-4"></div>');
          }
        }

        const sellersHTML = `
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5><i class="bi bi-people me-2"></i>Vendedores</h5>
              <div class="btn-group">
                <button class="btn btn-success btn-sm" onclick="dashboardManager.showLeadDistributionModal()" title="Distribuir Leads">
                  <i class="bi bi-share me-1"></i>Distribuir Leads
                </button>
                <button class="btn btn-primary btn-sm" onclick="dashboardManager.showCreateSellerModal()" title="Crear Nuevo Vendedor">
                  <i class="bi bi-person-plus me-1"></i>Nuevo Vendedor
                </button>
              </div>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Vendedor</th>
                      <th>Leads Asignados</th>
                      <th>Contactados</th>
                      <th>Último Acceso</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${response.data.sellers.map(seller => `
                      <tr>
                        <td>
                          <div>
                            <strong>${seller.name}</strong>
                            <br><small class="text-muted">@${seller.username}</small>
                          </div>
                        </td>
                        <td>
                          <span class="badge bg-primary">${seller.totalLeads || 0}</span>
                        </td>
                        <td>
                          <span class="badge bg-success">${seller.totalContacted || 0}</span>
                        </td>
                        <td>
                          <small class="text-muted">
                            ${seller.lastAccess ? this.formatLastAccess(seller.lastAccess) : 'Nunca'}
                          </small>
                        </td>
                        <td>
                          <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" 
                                    onclick="dashboardManager.showSellerDetail('${seller._id}')"
                                    title="Ver detalles">
                              <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-outline-info" 
                                    onclick="dashboardManager.showSellerTimeline('${seller._id}')"
                                    title="Ver cronología">
                              <i class="bi bi-graph-up"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;

        const sellersOverviewContainer = document.getElementById('sellersOverview');
        if (sellersOverviewContainer) {
          sellersOverviewContainer.innerHTML = sellersHTML;
        }
      }
    } catch (error) {
      console.error('Error loading sellers overview:', error);
    }
  }

  async loadMyStats(sellerId) {
    try {
      const response = await apiClient.get(`/users/${sellerId}/timeline-stats?period=${this.currentPeriod}`);
      if (response.success) {
        const stats = response.data;
        
        // Actualizar estadísticas básicas
        const totalAssigned = stats.timelineStats.reduce((sum, day) => sum + day.assigned, 0);
        const totalContacted = stats.timelineStats.reduce((sum, day) => sum + day.contacted, 0);
        const totalConverted = stats.timelineStats.reduce((sum, day) => sum + day.converted, 0);
        
        this.updateElement('myTotalLeads', totalAssigned);
        this.updateElement('myContactedLeads', totalContacted);
        this.updateElement('myPendingLeads', totalAssigned - totalContacted);
        
        // Mostrar gráfico temporal si hay contenedor
        this.renderTimelineChart(stats.timelineStats);
      }
    } catch (error) {
      console.error('Error loading seller stats:', error);
    }
  }

  async loadMyRecentLeads(sellerId) {
    try {
      const response = await apiClient.get(`/users/${sellerId}/detailed-leads?limit=5`);
      if (response.success) {
        const recentLeadsContainer = document.getElementById('recentLeads');
        if (recentLeadsContainer && response.data.leads) {
          const leadsHTML = response.data.leads.map(lead => `
            <div class="card mb-2 status-${lead.status}">
              <div class="card-body py-2">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="mb-1">${lead.name}</h6>
                    <small class="text-muted">
                      ${lead.phone} • ${this.getStatusLabel(lead.status)}
                    </small>
                  </div>
                  <small class="text-muted">
                    ${lead.daysSinceLastContact !== null 
                      ? `${lead.daysSinceLastContact}d` 
                      : 'Sin contactar'}
                  </small>
                </div>
              </div>
            </div>
          `).join('');
          
          recentLeadsContainer.innerHTML = leadsHTML;
        }
      }
    } catch (error) {
      console.error('Error loading recent leads:', error);
      const recentLeadsContainer = document.getElementById('recentLeads');
      if (recentLeadsContainer) {
        recentLeadsContainer.innerHTML = '<p class="text-muted">Error al cargar leads</p>';
      }
    }
  }

  // ========== GESTIÓN DE VENDEDORES ==========

  showCreateSellerModal() {
    const modalHTML = `
      <div class="modal fade" id="createSellerModal" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-person-plus me-2"></i>Crear Nuevo Vendedor
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="createSellerForm">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Nombre Completo *</label>
                  <input type="text" class="form-control" name="name" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Usuario *</label>
                  <input type="text" class="form-control" name="username" required>
                  <small class="text-muted">Solo letras, números y guiones bajos</small>
                </div>
                <div class="mb-3">
                  <label class="form-label">Email *</label>
                  <input type="email" class="form-control" name="email" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Contraseña Temporal *</label>
                  <input type="password" class="form-control" name="password" required minlength="6">
                  <small class="text-muted">Mínimo 6 caracteres</small>
                </div>
                <div class="mb-3">
                  <label class="form-label">Rol</label>
                  <select class="form-select" name="role">
                    <option value="seller" selected>Vendedor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" name="isActive" id="isActive" checked>
                  <label class="form-check-label" for="isActive">
                    Usuario activo
                  </label>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-primary">
                  <i class="bi bi-check me-1"></i>Crear Vendedor
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    // Eliminar modal existente si existe
    const existingModal = document.getElementById('createSellerModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Configurar evento de envío
    const form = document.getElementById('createSellerForm');
    form.addEventListener('submit', (e) => this.handleCreateSeller(e));

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('createSellerModal'));
    modal.show();
  }

  async handleCreateSeller(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const sellerData = {
      name: formData.get('name'),
      username: formData.get('username'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role'),
      isActive: formData.has('isActive')
    };

    try {
      const response = await apiClient.post('/users', sellerData);
      
      if (response.success) {
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('createSellerModal'));
        modal.hide();
        
        // Mostrar éxito
        this.showToast('Éxito', `Vendedor ${sellerData.name} creado correctamente`, 'success');
        
        // Recargar lista de vendedores
        await this.loadSellersOverview();
        
      } else {
        this.showToast('Error', response.message || 'Error al crear vendedor', 'danger');
      }
      
    } catch (error) {
      console.error('Error creating seller:', error);
      this.showToast('Error', 'Error de conexión al servidor', 'danger');
    }
  }

  // ========== DETALLE DE VENDEDORES ==========

  async showSellerDetail(sellerId) {
    try {
      const response = await apiClient.get(`/users/${sellerId}/detailed-leads`);
      
      if (response.success) {
        this.renderSellerDetailModal(response.data);
      }
      
    } catch (error) {
      console.error('Error loading seller detail:', error);
      this.showError('Error al cargar detalles del vendedor');
    }
  }

  renderSellerDetailModal(data) {
    const { seller, leads } = data;
    
    const modalHTML = `
      <div class="modal fade" id="sellerDetailModal" tabindex="-1">
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-person me-2"></i>Detalles: ${seller.name}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <!-- Estadísticas del vendedor -->
              <div class="row mb-4">
                <div class="col-md-3">
                  <div class="card bg-primary text-white">
                    <div class="card-body text-center">
                      <h4>${seller.totalLeads || 0}</h4>
                      <small>Total Leads</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="card bg-success text-white">
                    <div class="card-body text-center">
                      <h4>${seller.totalContacted || 0}</h4>
                      <small>Contactados</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="card bg-info text-white">
                    <div class="card-body text-center">
                      <h4>${seller.totalLeads > 0 ? Math.round((seller.totalContacted / seller.totalLeads) * 100) : 0}%</h4>
                      <small>Tasa Contacto</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="card bg-warning text-white">
                    <div class="card-body text-center">
                      <h4>${seller.lastAccess ? this.formatLastAccess(seller.lastAccess) : 'Nunca'}</h4>
                      <small>Último Acceso</small>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Lista de leads -->
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Lead</th>
                      <th>Estado</th>
                      <th>Días Asignado</th>
                      <th>Último Contacto</th>
                      <th>Próxima Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${leads.map(lead => `
                      <tr class="status-${lead.status}">
                        <td>
                          <div>
                            <strong>${lead.name}</strong>
                            <br><small class="text-muted">${lead.phone}</small>
                          </div>
                        </td>
                        <td>
                          <span class="badge bg-${this.getStatusColor(lead.status)}">
                            ${this.getStatusLabel(lead.status)}
                          </span>
                        </td>
                        <td>${lead.daysSinceAssigned || 0} días</td>
                        <td>
                          ${lead.daysSinceLastContact !== null 
                            ? `Hace ${lead.daysSinceLastContact} días` 
                            : 'Sin contactar'}
                        </td>
                        <td>
                          ${lead.nextAction 
                            ? new Date(lead.nextAction).toLocaleDateString() 
                            : 'Sin programar'}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Eliminar modal existente
    const existingModal = document.getElementById('sellerDetailModal');
    if (existingModal) existingModal.remove();

    // Agregar modal al DOM y mostrar
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('sellerDetailModal'));
    modal.show();
  }

  async showSellerTimeline(sellerId) {
    try {
      const response = await apiClient.get(`/users/${sellerId}/timeline-stats?period=${this.currentPeriod}`);
      
      if (response.success) {
        this.renderTimelineModal(response.data);
      }
      
    } catch (error) {
      console.error('Error loading seller timeline:', error);
      this.showError('Error al cargar cronología del vendedor');
    }
  }

  renderTimelineModal(data) {
    const modalHTML = `
      <div class="modal fade" id="timelineModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-graph-up me-2"></i>Cronología: ${data.seller.name}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <!-- Controles de período -->
              <div class="mb-3">
                <div class="btn-group" role="group">
                  <button class="btn btn-sm btn-outline-primary ${this.currentPeriod === 'week' ? 'active' : ''}" 
                          onclick="dashboardManager.changePeriod('week', '${data.seller.id}')">Semana</button>
                  <button class="btn btn-sm btn-outline-primary ${this.currentPeriod === 'month' ? 'active' : ''}"
                          onclick="dashboardManager.changePeriod('month', '${data.seller.id}')">Mes</button>
                  <button class="btn btn-sm btn-outline-primary ${this.currentPeriod === 'quarter' ? 'active' : ''}"
                          onclick="dashboardManager.changePeriod('quarter', '${data.seller.id}')">Trimestre</button>
                </div>
              </div>

              <!-- Gráfico -->
              <div id="timelineChart" style="height: 300px;">
                <div class="text-center text-muted">
                  <p>Gráfico temporal disponible próximamente</p>
                  <small>Datos: ${data.timelineStats.length} puntos de tiempo</small>
                </div>
              </div>

              <!-- Actividad reciente -->
              <div class="mt-4">
                <h6>Actividad Reciente</h6>
                <div class="list-group">
                  ${data.recentActivity.map(activity => `
                    <div class="list-group-item">
                      <div class="d-flex justify-content-between">
                        <strong>${activity.name}</strong>
                        <small>${new Date(activity.lastContact).toLocaleDateString()}</small>
                      </div>
                      <small class="text-muted">Estado: ${this.getStatusLabel(activity.status)}</small>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Eliminar modal existente
    const existingModal = document.getElementById('timelineModal');
    if (existingModal) existingModal.remove();

    // Agregar modal al DOM y mostrar
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('timelineModal'));
    modal.show();
  }

  async changePeriod(period, sellerId = null) {
    this.currentPeriod = period;
    
    if (sellerId) {
      await this.showSellerTimeline(sellerId);
    } else {
      await this.loadTemporalDashboard();
    }
  }

  // ========== UTILIDADES ==========

  async updateLastAccess() {
    const user = authManager.getCurrentUser();
    if (!user) return;

    try {
      await apiClient.put(`/users/${user._id}/last-access`);
    } catch (error) {
      console.error('Error updating last access:', error);
    }
  }

  updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  formatLastAccess(lastAccess) {
    if (!lastAccess) return 'Nunca';
    
    const date = new Date(lastAccess);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Hace momentos';
    if (diffHours < 24) return `Hace ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return date.toLocaleDateString();
  }

  getStatusLabel(status) {
    const statusLabels = {
      'uncontacted': 'Sin contactar',
      'contacted': 'Contactado',
      'interested': 'Interesado',
      'meeting': 'Reunión',
      'won': 'Ganado',
      'lost': 'Perdido'
    };
    return statusLabels[status] || status;
  }

  getStatusColor(status) {
    const statusColors = {
      'uncontacted': 'danger',
      'contacted': 'warning',
      'interested': 'info',
      'meeting': 'primary',
      'won': 'success',
      'lost': 'secondary'
    };
    return statusColors[status] || 'secondary';
  }

  showToast(title, message, type = 'info') {
    const toast = document.getElementById('alertToast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');

    if (toast && toastTitle && toastMessage) {
      toastTitle.textContent = title;
      toastMessage.textContent = message;
      
      toast.className = `toast text-bg-${type}`;
      
      const bsToast = new bootstrap.Toast(toast);
      bsToast.show();
    }
  }

  showError(message) {
    this.showToast('Error', message, 'danger');
  }

  // Inicialización automática
  async init() {
    await this.loadTemporalDashboard();
    
    // Actualizar cada 5 minutos
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    this.refreshInterval = setInterval(() => {
      this.loadTemporalDashboard();
    }, 5 * 60 * 1000);
  }

  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

// Instanciar dashboard manager
const dashboardManager = new DashboardManager();

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
  window.dashboardManager = dashboardManager;
}

// Auto-inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  // Solo inicializar si estamos en el dashboard
  if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
    setTimeout(() => dashboardManager.init(), 1000);
  }
});

console.log('📊 Dashboard module loaded with temporal features');