import api from '../axios';
import { Customer } from '../../types';

export const getCustomers = () =>
  api.get<Customer[]>('/customers').then((r) => r.data);

export const getCustomer = (id: number) =>
  api.get<Customer>(`/customers/${id}`).then((r) => r.data);

export const createCustomer = (data: Partial<Customer>) =>
  api.post<Customer>('/customers', data).then((r) => r.data);

export const updateCustomer = (id: number, data: Partial<Customer>) =>
  api.patch<Customer>(`/customers/${id}`, data).then((r) => r.data);

export const deleteCustomer = (id: number) =>
  api.delete(`/customers/${id}`).then((r) => r.data);
