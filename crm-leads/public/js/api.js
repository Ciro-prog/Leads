// API Client for CRM Leads Medical

class APIClient {
  constructor() {
    this.baseURL = '/api';
    this.token = localStorage.getItem('token');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // Get authentication headers
  getHeaders(contentType = 'application/json') {
    const headers = {};
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Make HTTP request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(options.contentType),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      
      // Handle different response types
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      if (!response.ok) {
        throw new APIError(data.message || 'Request failed', response.status, data);
      }

      return data;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      // Network or other errors
      throw new APIError('Network error or server unavailable', 0, error);
    }
  }

  // HTTP Methods
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  async uploadFile(endpoint, formData) {
    return this.request(endpoint, {
      method: 'POST',
      body: formData,
      contentType: null // Let browser set Content-Type for FormData
    });
  }

  // Authentication API
  async login(credentials) {
    const response = await this.post('/auth/login', credentials);
    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } finally {
      this.setToken(null);
    }
  }

  async getCurrentUser() {
    return this.get('/auth/me');
  }

  async changePassword(passwordData) {
    return this.put('/auth/change-password', passwordData);
  }

  // Users API
  async getUsers(params = {}) {
    return this.get('/users', params);
  }

  async getSellers() {
    return this.get('/users/sellers');
  }

  async getUser(id) {
    return this.get(`/users/${id}`);
  }

  async createUser(userData) {
    return this.post('/users', userData);
  }

  async updateUser(id, userData) {
    return this.put(`/users/${id}`, userData);
  }

  async toggleUserStatus(id) {
    return this.put(`/users/${id}/toggle-status`);
  }

  async deleteUser(id) {
    return this.delete(`/users/${id}`);
  }

  async getDashboardStats() {
    return this.get('/users/stats/dashboard');
  }

  // Leads API
  async getLeads(params = {}) {
    return this.get('/leads', params);
  }

  async getLead(id) {
    return this.get(`/leads/${id}`);
  }

  async createLead(leadData) {
    return this.post('/leads', leadData);
  }

  async updateLead(id, leadData) {
    return this.put(`/leads/${id}`, leadData);
  }

  async updateLeadStatus(id, statusData) {
    return this.put(`/leads/${id}/status`, statusData);
  }

  async assignLeads(assignmentData) {
    return this.post('/leads/assign', assignmentData);
  }

  async deleteLead(id) {
    return this.delete(`/leads/${id}`);
  }

  // Import API
  async uploadCSV(file) {
    const formData = new FormData();
    formData.append('csvFile', file);
    return this.uploadFile('/import/upload', formData);
  }

  async processImport(importData) {
    return this.post('/import/process', importData);
  }

  async getImportHistory(params = {}) {
    return this.get('/import/history', params);
  }

  async getImportDetails(id) {
    return this.get(`/import/${id}`);
  }

  // Health check
  async healthCheck() {
    return this.get('/health');
  }
}

// Custom Error class for API errors
class APIError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.response = response;
  }

  get isNetworkError() {
    return this.status === 0;
  }

  get isAuthError() {
    return this.status === 401 || this.status === 403;
  }

  get isValidationError() {
    return this.status === 400 && this.response && this.response.errors;
  }

  get isServerError() {
    return this.status >= 500;
  }
}

// Global API instances  
const api = new APIClient();
const apiClient = new APIClient();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APIClient, APIError, api, apiClient };
}

if (typeof window !== 'undefined') {
  window.api = api;
  window.apiClient = apiClient;
}