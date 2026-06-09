import api from '../axios';
import { Category } from '../../types';

export const getCategories = () =>
  api.get<Category[]>('/categories').then((r) => r.data);

export const getCategory = (id: number) =>
  api.get<Category>(`/categories/${id}`).then((r) => r.data);

export const createCategory = (data: Partial<Category>) =>
  api.post<Category>('/categories', data).then((r) => r.data);

export const updateCategory = (id: number, data: Partial<Category>) =>
  api.patch<Category>(`/categories/${id}`, data).then((r) => r.data);

export const deleteCategory = (id: number) =>
  api.delete(`/categories/${id}`).then((r) => r.data);
