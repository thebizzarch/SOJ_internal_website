/**
 * Data caching utility for the HR Metrics Dashboard
 */

class DataCache {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutes default TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  /**
   * Set a value in the cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} [customTtl] - Optional custom TTL in milliseconds
   */
  set(key, value, customTtl) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: customTtl || this.ttl
    });
  }

  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @returns {*} Cached value or null if expired/not found
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  /**
   * Check if a key exists in cache and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists and is not expired
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Remove a key from the cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cached data
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const now = Date.now();
    let totalItems = 0;
    let expiredItems = 0;
    let activeItems = 0;

    this.cache.forEach((item, key) => {
      totalItems++;
      if (now - item.timestamp > item.ttl) {
        expiredItems++;
      } else {
        activeItems++;
      }
    });

    return {
      totalItems,
      expiredItems,
      activeItems,
      hitRate: totalItems > 0 ? activeItems / totalItems : 0
    };
  }
}

// Create and export a singleton instance
const dataCache = new DataCache();
export default dataCache; 