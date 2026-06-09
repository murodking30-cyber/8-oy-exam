import api from '../axios';
import { Product } from '../../types';

export const getProducts = () =>
  api.get<Product[]>('/products').then((r) => r.data);

export const getProduct = (id: number) =>
  api.get<Product>(`/products/${id}`).then((r) => r.data);

export const createProduct = (data: Partial<Product>) =>
  api.post<Product>('/products', data).then((r) => r.data);

export const updateProduct = (id: number, data: Partial<Product>) =>
  api.patch<Product>(`/products/${id}`, data).then((r) => r.data);

export const deleteProduct = (id: number) =>
  api.delete(`/products/${id}`).then((r) => r.data);
