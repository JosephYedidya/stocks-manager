import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({ 
  baseURL: API_URL,
  timeout: 40000
});

export const getProducts = () => api.get('/products');
export const addProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const recordSale = (data) => api.post('/sales', data);
export const getSales = () => api.get('/sales');
export const resetProducts = () => api.delete('/products');
export const resetSales = () => api.delete('/sales');
