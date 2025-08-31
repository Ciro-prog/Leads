/**
 * ComponentBase - Foundation for Modular UI Components
 * Provides lifecycle management, state integration, and common utilities
 */

class ComponentBase {
  constructor(options = {}) {
    this.id = options.id || this.generateId();
    this.container = options.container;
    this.state = options.initialState || {};
    this.subscriptions = [];
    this.isInitialized = false;
    this.isDestroyed = false;
    
    // Component metadata
    this.name = options.name || this.constructor.name;
    this.version = options.version || '1.0.0';
    this.dependencies = options.dependencies || [];
    
    console.log(`🧩 Component ${this.name} created with ID: ${this.id}`);
  }

  /**
   * Component lifecycle methods
   */
  async init() {
    if (this.isInitialized) {
      console.warn(`⚠️ Component ${this.name} already initialized`);
      return;
    }

    try {
      console.log(`🚀 Initializing component: ${this.name}`);
      
      // Setup container
      this.setupContainer();
      
      // Setup state subscriptions
      this.setupStateSubscriptions();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Call component-specific initialization
      await this.onInit();
      
      this.isInitialized = true;
      console.log(`✅ Component ${this.name} initialized successfully`);
      
      // Trigger initialized event
      this.emit('initialized');
      
    } catch (error) {
      console.error(`❌ Failed to initialize component ${this.name}:`, error);
      throw error;
    }
  }

  async destroy() {
    if (this.isDestroyed) return;
    
    try {
      console.log(`🗑️ Destroying component: ${this.name}`);
      
      // Cleanup subscriptions
      this.cleanupSubscriptions();
      
      // Cleanup event listeners
      this.cleanupEventListeners();
      
      // Call component-specific cleanup
      await this.onDestroy();
      
      // Clear container
      if (this.container) {
        this.container.innerHTML = '';
      }
      
      this.isDestroyed = true;
      console.log(`✅ Component ${this.name} destroyed`);
      
    } catch (error) {
      console.error(`❌ Failed to destroy component ${this.name}:`, error);
    }
  }

  /**
   * State management integration
   */
  subscribe(path, callback, options = {}) {
    if (!window.stateManager) {
      console.error('StateManager not available');
      return;
    }

    const unsubscribe = window.stateManager.subscribe(path, callback, options);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  setState(path, value, action = 'UPDATE') {
    if (!window.stateManager) {
      console.error('StateManager not available');
      return;
    }

    window.stateManager.setState(path, value, action);
  }

  getState(path) {
    if (!window.stateManager) {
      console.error('StateManager not available');
      return null;
    }

    return window.stateManager.getState(path);
  }

  /**
   * Event system
   */
  emit(eventName, data = null) {
    const event = new CustomEvent(`component:${this.name}:${eventName}`, {
      detail: { component: this, data }
    });
    document.dispatchEvent(event);
  }

  on(eventName, handler) {
    const fullEventName = `component:${this.name}:${eventName}`;
    document.addEventListener(fullEventName, handler);
    
    // Store for cleanup
    if (!this.eventListeners) this.eventListeners = [];
    this.eventListeners.push({ event: fullEventName, handler });
  }

  /**
   * Rendering utilities
   */
  render(html) {
    if (!this.container) {
      console.error(`No container set for component ${this.name}`);
      return;
    }

    this.container.innerHTML = html;
    this.onRender();
  }

  appendRender(html) {
    if (!this.container) return;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    while (tempDiv.firstChild) {
      this.container.appendChild(tempDiv.firstChild);
    }
    
    this.onRender();
  }

  setLoading(isLoading, message = '') {
    const loadingKey = `${this.name}_loading`;
    window.stateManager?.setLoading(loadingKey, isLoading);
    
    if (isLoading && this.container) {
      this.showLoadingSkeleton(message);
    } else if (this.container) {
      this.hideLoadingSkeleton();
    }
  }

  showLoadingSkeleton(message = 'Loading...') {
    if (!this.container) return;
    
    const skeleton = `
      <div class="component-loading" data-component="${this.name}">
        <div class="skeleton-container">
          <div class="skeleton-header"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line"></div>
        </div>
        <p class="loading-message">${message}</p>
      </div>
    `;
    
    this.render(skeleton);
  }

  hideLoadingSkeleton() {
    if (!this.container) return;
    
    const loadingElement = this.container.querySelector('.component-loading');
    if (loadingElement) {
      loadingElement.remove();
    }
  }

  /**
   * DOM utilities
   */
  $(selector) {
    return this.container?.querySelector(selector);
  }

  $$(selector) {
    return this.container?.querySelectorAll(selector);
  }

  /**
   * API integration
   */
  async apiCall(endpoint, options = {}) {
    if (!window.apiManager) {
      console.error('APIManager not available');
      return null;
    }

    try {
      this.setLoading(true, `Loading ${this.name} data...`);
      const result = await window.apiManager.get(endpoint, options);
      return result;
    } catch (error) {
      console.error(`API call failed in component ${this.name}:`, error);
      this.handleError(error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async batchApiCalls(requests) {
    if (!window.apiManager) {
      console.error('APIManager not available');
      return [];
    }

    try {
      this.setLoading(true, `Loading ${this.name} data...`);
      const results = await window.apiManager.batchRequests(requests);
      return results;
    } catch (error) {
      console.error(`Batch API calls failed in component ${this.name}:`, error);
      this.handleError(error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Error handling
   */
  handleError(error, context = '') {
    const errorMessage = `Component ${this.name} error${context ? ` (${context})` : ''}: ${error.message}`;
    console.error(errorMessage, error);
    
    // Show user-friendly error
    if (this.container) {
      this.showError(error.message || 'An error occurred');
    }
    
    // Notify state manager
    if (window.stateManager) {
      window.stateManager.addNotification({
        type: 'error',
        title: `${this.name} Error`,
        message: error.message,
        component: this.name
      });
    }
    
    this.emit('error', { error, context });
  }

  showError(message) {
    const errorHtml = `
      <div class="component-error" data-component="${this.name}">
        <div class="error-icon">❌</div>
        <h3>Error in ${this.name}</h3>
        <p>${message}</p>
        <button onclick="this.closest('.component-error').remove()" class="btn-small">
          Dismiss
        </button>
      </div>
    `;
    
    this.render(errorHtml);
  }

  /**
   * Private methods
   */
  generateId() {
    return `component-${Math.random().toString(36).substr(2, 9)}`;
  }

  setupContainer() {
    if (!this.container) {
      console.warn(`No container provided for component ${this.name}`);
      return;
    }

    // Add component class and data attributes
    this.container.classList.add('component', `component-${this.name.toLowerCase()}`);
    this.container.setAttribute('data-component', this.name);
    this.container.setAttribute('data-component-id', this.id);
  }

  setupStateSubscriptions() {
    // Override in child classes to setup specific subscriptions
  }

  setupEventListeners() {
    // Override in child classes to setup specific event listeners
  }

  cleanupSubscriptions() {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
  }

  cleanupEventListeners() {
    if (this.eventListeners) {
      this.eventListeners.forEach(({ event, handler }) => {
        document.removeEventListener(event, handler);
      });
      this.eventListeners = [];
    }
  }

  /**
   * Lifecycle hooks - override in child classes
   */
  async onInit() {
    // Override in child classes
  }

  async onDestroy() {
    // Override in child classes  
  }

  onRender() {
    // Override in child classes
  }

  /**
   * Validation utilities
   */
  validateRequired(data, requiredFields) {
    const missing = requiredFields.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    return true;
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  /**
   * Performance monitoring
   */
  startTimer(operation) {
    const timerKey = `${this.name}_${operation}`;
    if (window.performanceMonitor) {
      return window.performanceMonitor.startTimer(timerKey);
    }
    return timerKey;
  }

  endTimer(timerKey) {
    if (window.performanceMonitor) {
      return window.performanceMonitor.endTimer(timerKey);
    }
    return null;
  }
}

/**
 * Component Registry - Manages component instances
 */
class ComponentRegistry {
  constructor() {
    this.components = new Map();
    this.types = new Map();
    console.log('🗂️ ComponentRegistry initialized');
  }

  register(ComponentClass, name = ComponentClass.name) {
    this.types.set(name, ComponentClass);
    console.log(`📝 Registered component type: ${name}`);
  }

  create(componentName, options = {}) {
    const ComponentClass = this.types.get(componentName);
    if (!ComponentClass) {
      throw new Error(`Component type ${componentName} not registered`);
    }

    const component = new ComponentClass(options);
    this.components.set(component.id, component);
    
    console.log(`🆕 Created component ${componentName} with ID: ${component.id}`);
    return component;
  }

  get(componentId) {
    return this.components.get(componentId);
  }

  async destroy(componentId) {
    const component = this.components.get(componentId);
    if (component) {
      await component.destroy();
      this.components.delete(componentId);
    }
  }

  async destroyAll() {
    const destroyPromises = Array.from(this.components.values()).map(c => c.destroy());
    await Promise.all(destroyPromises);
    this.components.clear();
    console.log('🧹 All components destroyed');
  }

  getByType(componentName) {
    return Array.from(this.components.values()).filter(c => c.name === componentName);
  }

  list() {
    return {
      instances: Array.from(this.components.values()),
      types: Array.from(this.types.keys()),
      count: this.components.size
    };
  }
}

// Global component registry
window.componentRegistry = new ComponentRegistry();

// Auto-cleanup on page unload
window.addEventListener('beforeunload', () => {
  window.componentRegistry.destroyAll();
});

console.log('🧩 ComponentBase system loaded');