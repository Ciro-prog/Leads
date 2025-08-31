// Authentication Module
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.token = localStorage.getItem('token');
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.token && this.currentUser;
  }

  // Get current user info
  getCurrentUser() {
    return this.currentUser;
  }

  // Set current user and token
  setCurrentUser(user, token) {
    this.currentUser = user;
    this.token = token;
    api.setToken(token);
    localStorage.setItem('token', token);
  }

  // Clear authentication
  clearAuth() {
    this.currentUser = null;
    this.token = null;
    api.setToken(null);
    localStorage.removeItem('token');
  }

  // Login function
  async login(credentials) {
    try {
      const response = await api.login(credentials);
      
      if (response.success) {
        this.setCurrentUser(response.data.user, response.data.token);
        return { success: true, user: response.data.user };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.message || 'Error de conexión al servidor' 
      };
    }
  }

  // Logout function
  async logout() {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  // Verify current session
  async verifySession() {
    if (!this.token) {
      return false;
    }

    try {
      const response = await api.getCurrentUser();
      
      if (response.success) {
        this.currentUser = response.data.user;
        return true;
      } else {
        this.clearAuth();
        return false;
      }
    } catch (error) {
      console.error('Session verification error:', error);
      this.clearAuth();
      return false;
    }
  }

  // Check user role
  hasRole(role) {
    return this.currentUser && this.currentUser.role === role;
  }

  // Check if user is admin
  isAdmin() {
    return this.hasRole('admin');
  }

  // Check if user is seller
  isSeller() {
    return this.hasRole('seller');
  }
}

// Global auth manager
const authManager = new AuthManager();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.authManager = authManager;
}