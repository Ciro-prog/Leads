/**
 * State Management System for CRM Leads
 * Centralized state with reactive subscriptions and middleware support
 */

class StateManager {
  constructor() {
    this.state = {
      // Authentication
      auth: {
        user: null,
        token: null,
        isAuthenticated: false
      },
      
      // Navigation
      navigation: {
        currentTab: 'dashboard',
        isLoading: false,
        loadedTabs: new Set(['dashboard']),
        history: []
      },
      
      // Leads data
      leads: {
        data: [],
        stats: {},
        filters: {},
        pagination: { page: 1, limit: 50, total: 0 },
        selectedIds: new Set(),
        cache: new Map()
      },
      
      // Sellers data
      sellers: {
        data: [],
        stats: {},
        activeCount: 0
      },
      
      // Dashboard data
      dashboard: {
        stats: {},
        charts: {},
        quickActions: []
      },
      
      // Import system
      import: {
        currentFile: null,
        previewData: null,
        mapping: {},
        history: []
      },
      
      // UI state
      ui: {
        loading: {},
        modals: {
          assignLead: false,
          leadDetail: false,
          createSeller: false
        },
        notifications: [],
        theme: 'light'
      },
      
      // System state
      system: {
        online: true,
        lastSync: null,
        version: '2.0.0'
      }
    };
    
    this.subscribers = new Map();
    this.middleware = [];
    this.devtools = window.__REDUX_DEVTOOLS_EXTENSION__;
    
    // Initialize performance tracking
    this.stateChanges = 0;
    this.lastUpdate = Date.now();
    
    console.log('🗃️ StateManager initialized with reactive state management');
  }

  /**
   * Subscribe to state changes with path-based reactivity
   */
  subscribe(path, callback, options = {}) {
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, new Set());
    }
    
    const subscription = {
      callback,
      options,
      id: Math.random().toString(36).substr(2, 9)
    };
    
    this.subscribers.get(path).add(subscription);
    
    // Immediate call with current value if requested
    if (options.immediate) {
      callback(this.getState(path), null, 'INIT');
    }
    
    // Return unsubscribe function
    return () => {
      this.subscribers.get(path)?.delete(subscription);
      if (this.subscribers.get(path)?.size === 0) {
        this.subscribers.delete(path);
      }
    };
  }

  /**
   * Set state with automatic notifications and middleware
   */
  setState(path, value, action = 'UPDATE', options = {}) {
    const oldValue = this.getState(path);
    
    // Skip update if value hasn't changed and not forced
    if (!options.force && JSON.stringify(oldValue) === JSON.stringify(value)) {
      return;
    }
    
    // Validate state update
    if (this.validateUpdate(path, value, oldValue)) {
      this.setStateValue(path, value);
      
      // Track state changes
      this.stateChanges++;
      this.lastUpdate = Date.now();
      
      // Apply middleware
      this.applyMiddleware(path, value, oldValue, action);
      
      // Notify subscribers
      this.notifySubscribers(path, value, oldValue, action);
      
      // DevTools integration
      if (this.devtools && window.location.hostname === 'localhost') {
        this.devtools.send(action, { path, value, oldValue });
      }
      
      console.debug(`🔄 State updated: ${path}`, { action, value, oldValue });
    }
  }

  /**
   * Get state value by path
   */
  getState(path) {
    if (!path) return this.state;
    
    const keys = path.split('.');
    let current = this.state;
    
    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }
    
    return current;
  }

  /**
   * Batch state updates for performance
   */
  batchUpdate(updates) {
    console.log(`📦 Batching ${updates.length} state updates`);
    
    const oldValues = {};
    
    // Apply all updates
    updates.forEach(({ path, value, action }) => {
      oldValues[path] = this.getState(path);
      this.setStateValue(path, value);
    });
    
    // Single notification cycle
    updates.forEach(({ path, value, action }) => {
      this.notifySubscribers(path, value, oldValues[path], action || 'BATCH_UPDATE');
    });
    
    this.stateChanges += updates.length;
    console.log(`✅ Batch update completed (${updates.length} changes)`);
  }

  /**
   * Set state value internally
   */
  setStateValue(path, value) {
    const keys = path.split('.');
    let current = this.state;
    
    // Navigate to parent object
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    // Set the value
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Validate state updates
   */
  validateUpdate(path, newValue, oldValue) {
    // Basic validation rules
    const validations = {
      'auth.user': (val) => val === null || (typeof val === 'object' && val.id),
      'leads.data': (val) => Array.isArray(val),
      'sellers.data': (val) => Array.isArray(val),
      'ui.loading': (val) => typeof val === 'object',
      'navigation.currentTab': (val) => typeof val === 'string' && val.length > 0
    };
    
    const validator = validations[path];
    if (validator && !validator(newValue)) {
      console.error(`❌ Invalid state update for ${path}:`, newValue);
      return false;
    }
    
    return true;
  }

  /**
   * Apply middleware for side effects
   */
  applyMiddleware(path, value, oldValue, action) {
    this.middleware.forEach(middleware => {
      try {
        middleware(path, value, oldValue, action, this.state);
      } catch (error) {
        console.error('❌ Middleware error:', error);
      }
    });
  }

  /**
   * Notify all relevant subscribers
   */
  notifySubscribers(path, newValue, oldValue, action) {
    // Notify exact path subscribers
    const exactSubscribers = this.subscribers.get(path);
    if (exactSubscribers) {
      exactSubscribers.forEach(sub => {
        try {
          sub.callback(newValue, oldValue, action);
        } catch (error) {
          console.error(`❌ Subscriber error for ${path}:`, error);
        }
      });
    }

    // Notify parent path subscribers
    const pathParts = path.split('.');
    for (let i = pathParts.length - 1; i > 0; i--) {
      const parentPath = pathParts.slice(0, i).join('.');
      const parentSubscribers = this.subscribers.get(parentPath);
      
      if (parentSubscribers) {
        const parentValue = this.getState(parentPath);
        parentSubscribers.forEach(sub => {
          try {
            sub.callback(parentValue, null, action);
          } catch (error) {
            console.error(`❌ Parent subscriber error for ${parentPath}:`, error);
          }
        });
      }
    }
  }

  /**
   * Add middleware for logging, persistence, etc.
   */
  addMiddleware(middleware) {
    this.middleware.push(middleware);
    console.log(`🔧 Middleware added (total: ${this.middleware.length})`);
  }

  /**
   * Helper methods for common operations
   */
  
  // Authentication helpers
  setUser(user) {
    this.batchUpdate([
      { path: 'auth.user', value: user },
      { path: 'auth.isAuthenticated', value: !!user },
      { path: 'auth.token', value: user?.token || null }
    ]);
  }

  // Navigation helpers
  setCurrentTab(tab) {
    this.setState('navigation.currentTab', tab, 'NAVIGATE');
    
    // Add to history
    const history = this.getState('navigation.history') || [];
    if (history[history.length - 1] !== tab) {
      history.push(tab);
      // Keep last 10 entries
      if (history.length > 10) history.shift();
      this.setState('navigation.history', history);
    }
  }

  // Loading state helpers
  setLoading(key, isLoading) {
    const currentLoading = this.getState('ui.loading') || {};
    currentLoading[key] = isLoading;
    this.setState('ui.loading', { ...currentLoading });
  }

  // Notification helpers
  addNotification(notification) {
    const notifications = this.getState('ui.notifications') || [];
    notifications.push({
      id: Date.now(),
      timestamp: new Date(),
      ...notification
    });
    this.setState('ui.notifications', notifications);
  }

  removeNotification(id) {
    const notifications = this.getState('ui.notifications') || [];
    this.setState('ui.notifications', notifications.filter(n => n.id !== id));
  }

  // Cache helpers for leads
  setCachedLeads(key, data) {
    const cache = this.getState('leads.cache') || new Map();
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: 300000 // 5 minutes
    });
    this.setState('leads.cache', cache);
  }

  getCachedLeads(key) {
    const cache = this.getState('leads.cache') || new Map();
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    
    return null;
  }

  /**
   * Debug and utility methods
   */
  getMetrics() {
    return {
      stateChanges: this.stateChanges,
      lastUpdate: this.lastUpdate,
      subscribersCount: this.subscribers.size,
      middlewareCount: this.middleware.length,
      stateSize: JSON.stringify(this.state).length
    };
  }

  exportState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  importState(newState) {
    this.state = { ...this.state, ...newState };
    console.log('🔄 State imported');
  }

  reset() {
    const initialState = this.state;
    this.state = JSON.parse(JSON.stringify(initialState));
    this.stateChanges = 0;
    console.log('🔄 State reset to initial values');
  }

  // Development helpers
  _debugState() {
    console.group('🗃️ State Manager Debug');
    console.log('Current State:', this.exportState());
    console.log('Metrics:', this.getMetrics());
    console.log('Subscribers:', Array.from(this.subscribers.keys()));
    console.groupEnd();
  }
}

// Persistence middleware - saves important data to localStorage
const persistenceMiddleware = (path, value, oldValue, action, state) => {
  const persistPaths = ['auth', 'ui.theme', 'navigation.currentTab'];
  
  if (persistPaths.some(p => path.startsWith(p))) {
    try {
      const dataToSave = {};
      persistPaths.forEach(p => {
        const val = path.split('.').reduce((obj, key) => obj?.[key], state);
        if (val !== undefined) {
          dataToSave[p] = val;
        }
      });
      
      localStorage.setItem('crmState', JSON.stringify(dataToSave));
    } catch (error) {
      console.warn('Could not persist state:', error);
    }
  }
};

// Logging middleware for development
const loggingMiddleware = (path, value, oldValue, action, state) => {
  if (window.location.hostname === 'localhost') {
    console.log(`🗃️ State: ${action} ${path}`, { value, oldValue });
  }
};

// Create global state manager
window.stateManager = new StateManager();

// Add built-in middleware
window.stateManager.addMiddleware(persistenceMiddleware);

if (window.location.hostname === 'localhost') {
  window.stateManager.addMiddleware(loggingMiddleware);
}

// Load persisted state
try {
  const persistedState = localStorage.getItem('crmState');
  if (persistedState) {
    const parsed = JSON.parse(persistedState);
    window.stateManager.importState(parsed);
    console.log('📁 Persisted state loaded');
  }
} catch (error) {
  console.warn('Could not load persisted state:', error);
}

// Debug helpers for development
window.debugState = () => window.stateManager._debugState();
window.getStateMetrics = () => window.stateManager.getMetrics();

console.log('🗃️ StateManager ready. Use debugState() to inspect.');