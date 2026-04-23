import { api, getProducts, getSales, recordSale, addProduct } from './client.js';
import { storage } from '../utils/storage.js';

export const offlineApi = {
  async getProductsOffline() {
    const cache = storage.getCache();
    let products = cache.products || [];

    try {
      const res = await getProducts();
      products = res.data;
      storage.setCache({ ...cache, products });
      console.log('✅ Products synced from network');
    } catch {
      // Using cached products
    }
    
    return { data: products };
  },

  async getSalesOffline() {
    const cache = storage.getCache();
    let sales = cache.sales || [];

    try {
      const res = await getSales();
      sales = res.data;
      storage.setCache({ ...cache, sales });
      console.log('✅ Sales synced from network');
    } catch {
      console.log('⚠️ Cached sales');
    }
    
    return { data: sales };
  },

  async recordSaleOffline(saleData) {
    const cache = storage.getCache();
    const localSale = { ...saleData, _id: `local-${Date.now()}`, synced: false };
    const updatedSales = [...(cache.sales || []), localSale];
    storage.setCache({ ...cache, sales: updatedSales });

    const tx = storage.addPending('recordSale', saleData);
    
    try {
      const res = await recordSale(saleData);
      const realSale = res.data;
      const newSales = updatedSales.map(s => s._id === localSale._id ? { ...s, ...realSale, synced: true } : s);
      storage.setCache({ ...cache, sales: newSales });
      storage.removePending(tx.id);
    } catch {
      console.log('🔄 Sale queued');
    }
    
    return { data: localSale };
  },

  async addProductOffline(productData) {
    const cache = storage.getCache();
    const localProduct = { ...productData, _id: `local-${Date.now()}`, synced: false };
    const updatedProducts = [...(cache.products || []), localProduct];
    storage.setCache({ ...cache, products: updatedProducts });

    const tx = storage.addPending('addProduct', productData);
    
    try {
      const res = await addProduct(productData);
      const realProduct = res.data;
      const newProducts = updatedProducts.map(p => p._id === localProduct._id ? { ...p, ...realProduct, synced: true } : p);
      storage.setCache({ ...cache, products: newProducts });
      storage.removePending(tx.id);
    } catch {
      console.log('🔄 Product queued');
    }
    
    return { data: localProduct };
  },

  async syncPending() {
    const pending = storage.getPending();
    if (!pending.length) return;

    console.log(`🔄 Syncing ${pending.length}...`);
    
    for (const tx of pending) {
      try {
        let res;
        switch (tx.type) {
          case 'recordSale':
            res = await recordSale(tx.payload);
            break;
          case 'addProduct':
            res = await addProduct(tx.payload);
            break;
        }
        storage.removePending(tx.id);
      } catch {
        tx.retries = (tx.retries || 0) + 1;
        if (tx.retries > 3) storage.removePending(tx.id);
      }
    }
  }
};

export const getProductsOffline = () => offlineApi.getProductsOffline();
export const getSalesOffline = () => offlineApi.getSalesOffline();
export const recordSaleOffline = (data) => offlineApi.recordSaleOffline(data);
export const addProductOffline = (data) => offlineApi.addProductOffline(data);
export const syncPending = () => offlineApi.syncPending();

