/**
 * Simple Performance Monitor for CRM Leads
 * Tracks API performance, navigation, and rate limiting
 */

class SimplePerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.apiMetrics = [];
    this.navigationTimes = [];
    this.rateLimitHits = 0;
    this.cacheHits = 0;
    this.started = false;

    // Thresholds for warnings
    this.thresholds = {
      apiResponse: 2000,  // 2s
      navigation: 1000,   // 1s
      totalLoad: 5000     // 5s
    };
  }

  start() {
    if (this.started) return;
    
    this.started = true;
    console.log('📊 Performance monitoring started');
    
    // Monitor page performance
    this.monitorPageLoad();
    
    // Monitor API calls if apiManager exists
    if (window.apiManager) {
      this.monitorAPIManager();
    }
    
    // Show metrics every 30 seconds in development
    if (window.location.hostname === 'localhost') {
      setInterval(() => this.showMetricsSummary(), 30000);
    }
  }

  monitorPageLoad() {
    if (performance.timing) {
      const navigation = performance.timing;
      const totalLoadTime = navigation.loadEventEnd - navigation.navigationStart;
      
      if (totalLoadTime > 0) {
        console.log(`📈 Page load time: ${totalLoadTime}ms`);
        this.recordMetric('pageLoad', totalLoadTime);
        
        if (totalLoadTime > this.thresholds.totalLoad) {
          console.warn(`⚠️ Slow page load: ${totalLoadTime}ms (threshold: ${this.thresholds.totalLoad}ms)`);
        }
      }
    }
  }

  monitorAPIManager() {
    // Wrap apiManager methods to track performance
    const originalGet = window.apiManager.get.bind(window.apiManager);
    
    window.apiManager.get = async (endpoint, options = {}) => {
      const startTime = performance.now();
      const metricName = `api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      try {
        const result = await originalGet(endpoint, options);
        const duration = performance.now() - startTime;
        
        this.recordAPIMetric(endpoint, duration, 'success', result._fromCache);
        
        if (duration > this.thresholds.apiResponse) {
          console.warn(`🐌 Slow API: ${endpoint} took ${duration.toFixed(0)}ms`);
        }
        
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.recordAPIMetric(endpoint, duration, 'error', false);
        
        if (error.status === 429) {
          this.rateLimitHits++;
          console.warn(`🚫 Rate limit hit for ${endpoint} (total hits: ${this.rateLimitHits})`);
        }
        
        throw error;
      }
    };

    // Wrap batch requests too
    const originalBatch = window.apiManager.batchRequests.bind(window.apiManager);
    
    window.apiManager.batchRequests = async (requests) => {
      const startTime = performance.now();
      
      try {
        const results = await originalBatch(requests);
        const duration = performance.now() - startTime;
        
        this.recordAPIMetric('batch_requests', duration, 'success', false);
        console.log(`📦 Batch request completed in ${duration.toFixed(0)}ms (${requests.length} requests)`);
        
        return results;
      } catch (error) {
        const duration = performance.now() - startTime;
        this.recordAPIMetric('batch_requests', duration, 'error', false);
        throw error;
      }
    };
  }

  recordMetric(name, value, metadata = {}) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      ...metadata
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name).push(metric);
    
    // Keep only last 100 measurements per metric
    if (this.metrics.get(name).length > 100) {
      this.metrics.get(name).shift();
    }
  }

  recordAPIMetric(endpoint, duration, status, fromCache) {
    if (fromCache) {
      this.cacheHits++;
    }

    this.apiMetrics.push({
      endpoint,
      duration,
      status,
      fromCache,
      timestamp: Date.now()
    });

    // Keep only last 200 API calls
    if (this.apiMetrics.length > 200) {
      this.apiMetrics.shift();
    }
  }

  startTimer(name) {
    this.recordMetric(`${name}_start`, performance.now());
    return name;
  }

  endTimer(name) {
    const startMetrics = this.metrics.get(`${name}_start`);
    if (startMetrics && startMetrics.length > 0) {
      const startTime = startMetrics[startMetrics.length - 1].value;
      const duration = performance.now() - startTime;
      
      this.recordMetric(name, duration);
      
      // Check threshold and warn if slow
      const category = this.getMetricCategory(name);
      const threshold = this.thresholds[category];
      
      if (threshold && duration > threshold) {
        console.warn(`⏱️ Slow ${category}: ${name} took ${duration.toFixed(0)}ms (threshold: ${threshold}ms)`);
      }
      
      return duration;
    }
    
    return null;
  }

  getMetricCategory(name) {
    if (name.includes('api') || name.includes('request')) return 'apiResponse';
    if (name.includes('navigation') || name.includes('load')) return 'navigation';
    return 'other';
  }

  showMetricsSummary() {
    const summary = this.generateSummary();
    console.group('📊 Performance Metrics Summary');
    console.log('API Calls:', summary.apiCalls);
    console.log('Cache Hit Rate:', `${summary.cacheHitRate}%`);
    console.log('Rate Limit Hits:', summary.rateLimitHits);
    console.log('Average API Response:', `${summary.avgApiResponse}ms`);
    console.log('Slowest API:', summary.slowestApi);
    console.groupEnd();
  }

  generateSummary() {
    const now = Date.now();
    const last5Minutes = this.apiMetrics.filter(m => now - m.timestamp < 300000);
    
    const successful = last5Minutes.filter(m => m.status === 'success');
    const fromCache = last5Minutes.filter(m => m.fromCache);
    const avgResponse = successful.length > 0 
      ? Math.round(successful.reduce((sum, m) => sum + m.duration, 0) / successful.length)
      : 0;
    
    const slowest = last5Minutes.reduce((slowest, current) => 
      current.duration > slowest.duration ? current : slowest, 
      { endpoint: 'none', duration: 0 }
    );
    
    return {
      apiCalls: last5Minutes.length,
      successfulCalls: successful.length,
      cacheHitRate: last5Minutes.length > 0 
        ? Math.round((fromCache.length / last5Minutes.length) * 100)
        : 0,
      rateLimitHits: this.rateLimitHits,
      avgApiResponse: avgResponse,
      slowestApi: slowest.endpoint !== 'none' 
        ? `${slowest.endpoint} (${Math.round(slowest.duration)}ms)`
        : 'none'
    };
  }

  // Get metrics for debugging
  getMetrics() {
    return {
      summary: this.generateSummary(),
      recentApiCalls: this.apiMetrics.slice(-20),
      allMetrics: Object.fromEntries(this.metrics),
      apiManagerMetrics: window.apiManager?.getMetrics?.() || {}
    };
  }

  // Export metrics (useful for debugging)
  exportMetrics() {
    const data = this.getMetrics();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm-performance-metrics-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📊 Performance metrics exported');
  }
}

// Create global instance
window.performanceMonitor = new SimplePerformanceMonitor();

// Auto-start monitoring when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.performanceMonitor.start();
});

// Add console command for debugging
window.showPerformanceMetrics = () => {
  console.table(window.performanceMonitor.getMetrics().summary);
  return window.performanceMonitor.getMetrics();
};

console.log('📊 Performance Monitor loaded. Use showPerformanceMetrics() to see stats.');