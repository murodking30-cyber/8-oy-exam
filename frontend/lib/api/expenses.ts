import api from '../axios';
import { Expense, ExpenseCategory } from '../../types';

export const getExpenses = () =>
  api.get<Expense[]>('/expenses').then((r) => r.data);

export const getExpense = (id: number) =>
  api.get<Expense>(`/expenses/${id}`).then((r) => r.data);

export const createExpense = (data: {
  category: ExpenseCategory;
  amount: number;
  date: string;
  note?: string;
}) => api.post<Expense>('/expenses', data).then((r) => r.data);

export const updateExpense = (id: number, data: Partial<{
  category: ExpenseCategory;
  amount: number;
  date: string;
  note: string;
}>) => api.patch<Expense>(`/expenses/${id}`, data).then((r) => r.data);

export const deleteExpense = (id: number) =>
  api.delete(`/expenses/${id}`).then((r) => r.data);
