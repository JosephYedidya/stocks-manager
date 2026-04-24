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
      const serverSales = res.data || [];
      // Normalize server sales: ensure productId exists even if server returns `product`
      const normalizedServerSales = serverSales.map(sale => {
        const productId = sale.productId || (typeof sale.product === 'string' ? sale.product : sale.product?._id);
        const serverProductName = typeof sale.product === 'object' ? sale.product?.name : undefined;
        const serverProductPrice = typeof sale.product === 'object' ? sale.product?.price : undefined;
        return {
          ...sale,
          productId: productId || sale.productId,
          productName: sale.productName || serverProductName || undefined,
          productPrice: sale.productPrice || serverProductPrice || undefined,
        };
      });
      // Merge server data with local cache to preserve product details
      const localSalesMap = new Map(sales.map(s => [s._id, s]));
      const mergedSales = normalizedServerSales.map(serverSale => {
        const localSale = localSalesMap.get(serverSale._id);
        if (localSale) {
          return {
            ...localSale,
            ...serverSale,
            productName: serverSale.productName || localSale.productName,
            productPrice: serverSale.productPrice || localSale.productPrice,
            variantType: serverSale.variantType || localSale.variantType,
          };
        }
        return serverSale;
      });
      // Keep any local-only sales that haven't been synced yet
      const serverIds = new Set(normalizedServerSales.map(s => s._id));
      const localOnlySales = sales.filter(s => !serverIds.has(s._id));
      sales = [...mergedSales, ...localOnlySales];
      
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
      // Normalize server response product reference
      const serverProductId = realSale.productId || (typeof realSale.product === 'string' ? realSale.product : realSale.product?._id);
      const serverProductName = typeof realSale.product === 'object' ? realSale.product?.name : undefined;
      const serverProductPrice = typeof realSale.product === 'object' ? realSale.product?.price : undefined;
      const normalizedRealSale = {
        ...realSale,
        productId: serverProductId || realSale.productId,
        productName: realSale.productName || serverProductName || undefined,
        productPrice: realSale.productPrice || serverProductPrice || undefined,
      };
      const newSales = updatedSales.map(s => s._id === localSale._id ? {
        ...s,
        ...normalizedRealSale,
        productName: normalizedRealSale.productName || s.productName,
        productPrice: normalizedRealSale.productPrice || s.productPrice,
        variantType: normalizedRealSale.variantType || s.variantType,
        synced: true
      } : s);
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

