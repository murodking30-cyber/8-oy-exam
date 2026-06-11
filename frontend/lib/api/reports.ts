import api from '../axios';
import { InventoryStats } from '../../types';

export const getInventoryStats = () =>
  api.get<InventoryStats>('/reports/inventory-stats').then((r) => r.data);

export const getTopProducts = (limit = 10) =>
  api.get(`/reports/top-products?limit=${limit}`).then((r) => r.data);

export const getLowStockProducts = () =>
  api.get('/reports/low-stock').then((r) => r.data);

export const getRevenueByMonth = () =>
  api.get('/reports/revenue-by-month').then((r) => r.data);
