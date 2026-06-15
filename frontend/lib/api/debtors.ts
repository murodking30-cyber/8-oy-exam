import api from '../axios';
import { Debtor } from '../../types';

export const getDebtors = () =>
  api.get<Debtor[]>('/debtors').then((r) => r.data);

export const getDebtor = (id: number) =>
  api.get<Debtor>(`/debtors/${id}`).then((r) => r.data);

export const createDebtor = (data: {
  name: string;
  phone?: string;
  product?: string;
  quantity?: number;
  totalAmount: number;
  paidAmount?: number;
  debtDate: string;
  lastPaymentDate?: string;
  note?: string;
}) => api.post<Debtor>('/debtors', data).then((r) => r.data);

export const updateDebtor = (id: number, data: Partial<{
  name: string;
  phone: string;
  product: string;
  quantity: number;
  totalAmount: number;
  paidAmount: number;
  debtDate: string;
  lastPaymentDate: string;
  note: string;
}>) => api.patch<Debtor>(`/debtors/${id}`, data).then((r) => r.data);

export const addPayment = (id: number, data: {
  amount: number;
  paymentDate: string;
  note?: string;
}) => api.post<Debtor>(`/debtors/${id}/payment`, data).then((r) => r.data);

export const deleteDebtor = (id: number) =>
  api.delete(`/debtors/${id}`).then((r) => r.data);
