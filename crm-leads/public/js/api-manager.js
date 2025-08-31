/**
 * Advanced API Manager with Request Deduplication, Caching, and Batching
 * Solves rate limiting issues and improves performance
 */

class APIManager {
  constructor(baseApiClient) {
    this.baseClient = baseApiClient;
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.requestQueue = [];
    this.isProcessing = false;
    this.batchTimeout = null;
    
    // Cache configuration by endpoint pattern
    this.cacheConfig = {
      '/leads/stats': { ttl: 60000, priority: 'high' },     // 1 min cache for stats
      '/users/stats': { ttl: 60000, priority: 'high' },     // 1 min cache for stats  
      '/users/sellers': { ttl: 300000, priority: 'medium' }, // 5 min cache for sellers
      '/leads/provinces': { ttl: 300000, priority: 'medium' }, // 5 min cache for provinces
      '/leads?': { ttl: 30000, priority: 'low' }            // 30s cache for leads data
    };

    console.log('🚀 APIManager initialized with intelligent caching and deduplication');
  }

  /**
   * Main request method with deduplication and caching
   */
  async get(endpoint, options = {}) {
    const cacheKey = this.createCacheKey(endpoint, options);
    
    // Check cache first
    const cachedResponse = this.getFromCache(cacheKey);
    if (cachedResponse) {
      console.log(`⚡ Cache hit for ${endpoint}`);
      return cachedResponse;
    }

    // Check if identical request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      console.log(`🔄 Deduplicating request for ${endpoint}`);
      return this.pendingRequests.get(cacheKey);
    }

    // Create new request
    const requestPromise = this.executeRequest(endpoint, options, cacheKey);
    this.pendingRequests.set(cacheKey, requestPromise);
    
    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Cleanup pending request
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Batch multiple requests to reduce rate limiting impact
   */
  async batchRequests(requests) {
    console.log(`📦 Batching ${requests.length} requests`);
    
    const promises = requests.map(req => {
      if (typeof req === 'string') {
        return this.get(req);
      } else {
        return this.get(req.endpoint, req.options);
      }
    });

    try {
      const results = await Promise.allSettled(promises);
      
      // Process results and log any failures
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - successful;
      
      if (failed > 0) {
        console.warn(`⚠️ Batch completed with ${successful}/${results.length} successful requests`);
      } else {
        console.log(`✅ Batch completed successfully (${successful} requests)`);
      }
      
      return results;
    } catch (error) {
      console.error('❌ Batch request failed:', error);
      throw error;
    }
  }

  /**
   * Execute actual API request with retry logic
   */
  async executeRequest(endpoint, options, cacheKey) {
    const maxRetries = 3;
    let attempt = 1;

    while (attempt <= maxRetries) {
      try {
        console.log(`🔄 API Request (attempt ${attempt}): ${endpoint}`);
        
        const response = await this.baseClient.get(endpoint, options);
        
        // Cache successful response
        this.setCache(cacheKey, response, endpoint);
        
        console.log(`✅ API Success: ${endpoint}`);
        return response;
        
      } catch (error) {
        if (error.status === 429) { // Too Many Requests
          const retryAfter = error.headers?.['retry-after'] || Math.pow(2, attempt);
          console.warn(`⏱️ Rate limited, retrying after ${retryAfter}s (attempt ${attempt}/${maxRetries})`);
          
          if (attempt < maxRetries) {
            await this.sleep(retryAfter * 1000);
            attempt++;
            continue;
          }
        }

        if (attempt < maxRetries && this.isRetryableError(error)) {
          console.warn(`🔄 Retrying request (attempt ${attempt}/${maxRetries}):`, error.message);
          await this.sleep(1000 * attempt); // Exponential backoff
          attempt++;
          continue;
        }

        console.error(`❌ API Failed: ${endpoint}`, error);
        throw error;
      }
    }
  }

  /**
   * Cache management
   */
  createCacheKey(endpoint, options = {}) {
    const params = new URLSearchParams(options).toString();
    return `${endpoint}${params ? '?' + params : ''}`;
  }

  getFromCache(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    const { data, timestamp, ttl } = cached;
    const age = Date.now() - timestamp;
    
    if (age > ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return data;
  }

  setCache(cacheKey, data, endpoint) {
    // Find matching cache config
    const config = this.findCacheConfig(endpoint);
    if (!config) return;

    this.cache.set(cacheKey, {
      data: JSON.parse(JSON.stringify(data)), // Deep clone to prevent mutations
      timestamp: Date.now(),
      ttl: config.ttl,
      priority: config.priority
    });

    // Cleanup old cache entries if we have too many
    this.cleanupCache();
  }

  findCacheConfig(endpoint) {
    for (const [pattern, config] of Object.entries(this.cacheConfig)) {
      if (endpoint.includes(pattern.replace('?', ''))) {
        return config;
      }
    }
    return null;
  }

  cleanupCache() {
    if (this.cache.size > 100) { // Keep max 100 cached entries
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest 25%
      const toRemove = entries.slice(0, Math.floor(entries.length * 0.25));
      toRemove.forEach(([key]) => this.cache.delete(key));
      
      console.log(`🧹 Cache cleanup: removed ${toRemove.length} old entries`);
    }
  }

  /**
   * Utility methods
   */
  isRetryableError(error) {
    // Retry on network errors, timeouts, and 5xx errors
    return !error.status || error.status >= 500 || error.message.includes('Network');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cache and performance metrics
   */
  getMetrics() {
    const cacheEntries = Array.from(this.cache.values());
    const hitsByPriority = cacheEntries.reduce((acc, entry) => {
      acc[entry.priority] = (acc[entry.priority] || 0) + 1;
      return acc;
    }, {});

    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      cacheHitsByPriority: hitsByPriority,
      queueLength: this.requestQueue.length
    };
  }

  /**
   * POST method with caching support
   */
  async post(endpoint, data = {}, options = {}) {
    try {
      const response = await this.baseClient.post(endpoint, data);
      // Clear related cache entries after successful POST
      this.clearCache(endpoint.split('/')[1]); // Clear by first path segment
      return response;
    } catch (error) {
      console.error(`❌ POST Failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * PUT method with caching support
   */
  async put(endpoint, data = {}, options = {}) {
    try {
      const response = await this.baseClient.put(endpoint, data);
      // Clear related cache entries after successful PUT
      this.clearCache(endpoint.split('/')[1]); // Clear by first path segment
      return response;
    } catch (error) {
      console.error(`❌ PUT Failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * DELETE method with caching support
   */
  async delete(endpoint, options = {}) {
    try {
      const response = await this.baseClient.delete(endpoint);
      // Clear related cache entries after successful DELETE
      this.clearCache(endpoint.split('/')[1]); // Clear by first path segment
      return response;
    } catch (error) {
      console.error(`❌ DELETE Failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Form data upload method
   */
  async postFormData(endpoint, formData, options = {}) {
    try {
      const response = await this.baseClient.uploadFile(endpoint, formData);
      // Clear related cache entries after successful upload
      this.clearCache(endpoint.split('/')[1]); // Clear by first path segment
      return response;
    } catch (error) {
      console.error(`❌ Upload Failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Clear cache manually if needed
   */
  clearCache(pattern) {
    if (pattern) {
      const keys = Array.from(this.cache.keys()).filter(key => key.includes(pattern));
      keys.forEach(key => this.cache.delete(key));
      console.log(`🧹 Cleared ${keys.length} cache entries matching "${pattern}"`);
    } else {
      this.cache.clear();
      console.log('🧹 All cache cleared');
    }
  }

  /**
   * Force refresh specific endpoint (bypass cache)
   */
  async forceRefresh(endpoint, options = {}) {
    const cacheKey = this.createCacheKey(endpoint, options);
    this.cache.delete(cacheKey);
    return this.get(endpoint, options);
  }
}

// Enhanced APIClient with better error handling
class EnhancedAPIClient extends APIClient {
  constructor() {
    super();
  }

  async get(endpoint, options = {}) {
    const startTime = performance.now();
    
    try {
      const response = await super.get(endpoint, options);
      const duration = performance.now() - startTime;
      
      // Log slow requests
      if (duration > 1000) {
        console.warn(`🐌 Slow API request: ${endpoint} took ${duration.toFixed(0)}ms`);
      }
      
      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`❌ API Error after ${duration.toFixed(0)}ms:`, {
        endpoint,
        error: error.message,
        status: error.status
      });
      throw error;
    }
  }
}

// Create global instances
window.enhancedApiClient = new EnhancedAPIClient();
window.apiManager = new APIManager(window.enhancedApiClient);

console.log('✅ Enhanced API system loaded');