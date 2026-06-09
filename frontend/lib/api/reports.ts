import api from '../axios';
import { SalesSummary } from '../../types';

export const getSalesSummary = () =>
  api.get<SalesSummary>('/reports/sales-summary').then((r) => r.data);

export const getTopProducts = (limit = 10) =>
  api.get(`/reports/top-products?limit=${limit}`).then((r) => r.data);

export const getTopCustomers = (limit = 10) =>
  api.get(`/reports/top-customers?limit=${limit}`).then((r) => r.data);

export const getLowStockProducts = (threshold = 10) =>
  api.get(`/reports/low-stock?threshold=${threshold}`).then((r) => r.data);

export const getRevenueByMonth = () =>
  api.get('/reports/revenue-by-month').then((r) => r.data);

export const getOrdersByStatus = () =>
  api.get('/reports/orders-by-status').then((r) => r.data);
