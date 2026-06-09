import api from '../axios';
import { Payment } from '../../types';

export const getPayments = () =>
  api.get<Payment[]>('/payments').then((r) => r.data);

export const getPayment = (id: number) =>
  api.get<Payment>(`/payments/${id}`).then((r) => r.data);

export const createPayment = (data: {
  orderId: number;
  amount: number;
  method: string;
  transactionId?: string;
  notes?: string;
}) => api.post<Payment>('/payments', data).then((r) => r.data);

export const updatePayment = (
  id: number,
  data: { status?: string; notes?: string }
) => api.patch<Payment>(`/payments/${id}`, data).then((r) => r.data);

export const deletePayment = (id: number) =>
  api.delete(`/payments/${id}`).then((r) => r.data);
