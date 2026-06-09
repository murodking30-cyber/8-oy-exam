import api from '../axios';
import type { User } from '../../types';

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

export const getUsers = () =>
  api.get<User[]>('/users').then((r) => r.data);

export const createUser = (data: CreateUserPayload) =>
  api.post<User>('/users', data).then((r) => r.data);

export const updateUser = (id: number, data: UpdateUserPayload) =>
  api.patch<User>(`/users/${id}`, data).then((r) => r.data);

export const deleteUser = (id: number) =>
  api.delete(`/users/${id}`).then((r) => r.data);
