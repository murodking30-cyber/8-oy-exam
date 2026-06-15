import api from '../axios';
import { StockIn } from '../../types';

export const getStockIns = () =>
  api.get<StockIn[]>('/stock-in').then((r) => r.data);

export const getStockIn = (id: number) =>
  api.get<StockIn>(`/stock-in/${id}`).then((r) => r.data);

export const createStockIn = (data: {
  productId: number;
  quantity: number;
  unit?: string;
  purchasePrice?: number;
  date: string;
  supplierId?: number;
  note?: string;
}) => api.post<StockIn>('/stock-in', data).then((r) => r.data);

export const deleteStockIn = (id: number) =>
  api.delete(`/stock-in/${id}`).then((r) => r.data);
