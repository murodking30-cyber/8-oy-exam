import api from '../axios';
import { StockOut } from '../../types';

export const getStockOuts = () =>
  api.get<StockOut[]>('/stock-out').then((r) => r.data);

export const getStockOut = (id: number) =>
  api.get<StockOut>(`/stock-out/${id}`).then((r) => r.data);

export const createStockOut = (data: {
  productId: number;
  quantity: number;
  unit?: string;
  salePrice?: number;
  date: string;
  customer?: string;
  note?: string;
}) => api.post<StockOut>('/stock-out', data).then((r) => r.data);

export const deleteStockOut = (id: number) =>
  api.delete(`/stock-out/${id}`).then((r) => r.data);
