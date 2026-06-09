import api from '../axios';
import { Order } from '../../types';

export const getOrders = () =>
  api.get<Order[]>('/orders').then((r) => r.data);

export const getOrder = (id: number) =>
  api.get<Order>(`/orders/${id}`).then((r) => r.data);

export const createOrder = (data: {
  customerId: number;
  items: { productId: number; quantity: number }[];
  notes?: string;
}) => api.post<Order>('/orders', data).then((r) => r.data);

export const updateOrder = (id: number, data: { status?: string; notes?: string }) =>
  api.patch<Order>(`/orders/${id}`, data).then((r) => r.data);

export const cancelOrder = (id: number) =>
  api.patch<Order>(`/orders/${id}/cancel`).then((r) => r.data);

export const deleteOrder = (id: number) =>
  api.delete(`/orders/${id}`).then((r) => r.data);
