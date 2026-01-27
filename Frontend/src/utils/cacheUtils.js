export const CACHE_KEYS = {
  INVENTORY_RAW: "inventory_raw",
  CATEGORIES: "categories",
  SUBCATEGORIES: "subcategories",
  CUSTOMERS: "customers",
  PRODUCTS_FLAT: "products",
  SALES: "sales",
  BRANCH_INFO: "branch_info",
};

export const TTL = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  LONG: 60 * 60 * 1000, // 1 hour
};

const CACHE_NAME = "kes-app-data-cache";

/**
 * Stores data in the Browser's Cache Storage (Cache API)
 * @param {string} key
 * @param {any} data
 * @param {number} ttl
 */
export const setCache = async (key, data, ttl) => {
  try {
    const cache = await caches.open(CACHE_NAME);
    const entry = {
      data,
      expiry: Date.now() + ttl,
    };
    const response = new Response(JSON.stringify(entry), {
      headers: { "Content-Type": "application/json" },
    });
    // We use a fake URL scheme to store arbitrary data keys
    const url = `https://cache-store/${key}`;
    await cache.put(url, response);
  } catch (e) {
    console.error("Cache Storage set error:", e);
  }
};

/**
 * Retrieves data from the Browser's Cache Storage (Cache API)
 * @param {string} key
 * @returns {any | null}
 */
export const getCache = async (key) => {
  try {
    const cache = await caches.open(CACHE_NAME);
    const url = `https://cache-store/${key}`;
    const response = await cache.match(url);

    if (!response) return null;

    const entry = await response.json();
    if (Date.now() > entry.expiry) {
      await cache.delete(url);
      return null;
    }

    return entry.data;
  } catch (e) {
    console.error("Cache Storage get error:", e);
    return null;
  }
};

/**
 * Removes a specific item from the Cache Storage
 * @param {string} key
 */
export const removeCache = async (key) => {
  try {
    const cache = await caches.open(CACHE_NAME);
    const url = `https://cache-store/${key}`;
    await cache.delete(url);
  } catch (e) {
    console.error("Cache Storage remove error:", e);
  }
};

/**
 * Clears all application data from Cache Storage
 */
export const clearAllCache = async () => {
  try {
    await caches.delete(CACHE_NAME);
  } catch (e) {
    console.error("Cache Storage clear error:", e);
  }
};
