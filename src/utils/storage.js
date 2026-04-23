/**
 * Simple offline storage for stocks app
 */
const CACHE_KEY = 'stocks-offline-cache';
const PENDING_KEY = 'stocks-pending-sales';

export const storage = {
  getCache() {
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    } catch {
      return { products: [], sales: [] };
    }
  },

  setCache(cache) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  },

  getPending() {
    try {
      return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
    } catch {
      return [];
    }
  },

  addPending(sale) {
    const pending = this.getPending();
    const saleWithId = { ...sale, localId: Date.now() };
    const newPending = [saleWithId, ...pending];
    localStorage.setItem(PENDING_KEY, JSON.stringify(newPending));
  },

  clearPending() {
    localStorage.removeItem(PENDING_KEY);
  },

  getPendingCount() {
    return this.getPending().length;
  }

};

