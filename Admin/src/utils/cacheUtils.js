/**
 * Cache Storage Utility using the Cache API
 * Stores data as JSON Responses in the browser's Cache Storage.
 */

const CACHE_NAME = "KES_ADMIN_DATA_CACHE_V1";

// specific TTLs for different data types (in milliseconds)
export const TTL = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 60 * 60 * 1000, // 1 hour
  LONG: 24 * 60 * 60 * 1000, // 24 hours
};

export const CACHE_KEYS = {
  PRODUCTS: "/cache/api/products", // Cache API functionality requires URL-like keys
  CATEGORIES: "/cache/api/categories",
  SUBCATEGORIES: "/cache/api/sub_categories",
  BRANCHES: "/cache/api/branches",
  INVENTORY: "/cache/api/inventory",
  DASHBOARD: "/cache/api/dashboard",
  ACCOUNTS: "/cache/api/accounts",
};

/**
 * Save data to Cache Storage
 * @param {string} urlKey - Virtual URL key for the cache
 * @param {any} data - Data to store
 * @param {number} ttl - Time to live in ms
 */
export const setCache = async (urlKey, data, ttl = TTL.MEDIUM) => {
  try {
    const cache = await caches.open(CACHE_NAME);

    const cacheItem = {
      data,
      expiry: Date.now() + ttl,
      timestamp: Date.now(),
    };

    // Create a Response object with the JSON data
    const response = new Response(JSON.stringify(cacheItem), {
      headers: { "Content-Type": "application/json" },
    });

    await cache.put(urlKey, response);
  } catch (error) {
    console.warn("Failed to save to cache storage:", error);
  }
};

/**
 * Get data from Cache Storage
 * @param {string} urlKey - Virtual URL key
 * @returns {Promise<any|null>} - Cached data or null if expired/missing
 */
export const getCache = async (urlKey) => {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(urlKey);

    if (!response) return null;

    const cacheItem = await response.json();

    // Check expiry
    if (Date.now() > cacheItem.expiry) {
      await cache.delete(urlKey);
      return null;
    }

    return cacheItem.data;
  } catch (error) {
    console.error("Cache retrieval error:", error);
    return null;
  }
};

/**
 * Remove specific item from cache
 * @param {string} urlKey
 */
export const removeCache = async (urlKey) => {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(urlKey);
  } catch (error) {
    console.error("Error removing cache item:", error);
  }
};

/**
 * Clear all app-specific cache
 */
export const clearAppCache = async () => {
  try {
    await caches.delete(CACHE_NAME);
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
};
