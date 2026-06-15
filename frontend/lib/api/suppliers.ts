import api from '../axios';
import { Supplier } from '../../types';

export const getSuppliers = () =>
  api.get<Supplier[]>('/suppliers').then((r) => r.data);

export const getSupplier = (id: number) =>
  api.get<Supplier>(`/suppliers/${id}`).then((r) => r.data);

export const createSupplier = (data: {
  name: string;
  phone?: string;
  address?: string;
  note?: string;
}) => api.post<Supplier>('/suppliers', data).then((r) => r.data);

export const updateSupplier = (id: number, data: Partial<{
  name: string;
  phone: string;
  address: string;
  note: string;
}>) => api.patch<Supplier>(`/suppliers/${id}`, data).then((r) => r.data);

export const deleteSupplier = (id: number) =>
  api.delete(`/suppliers/${id}`).then((r) => r.data);
