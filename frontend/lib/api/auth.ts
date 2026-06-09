import api from '../axios';
import { AuthResponse, RegisterResponse } from '../../types';

export const register = (data: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}) => api.post<RegisterResponse>('/auth/register', data).then((r) => r.data);

export const verifyCode = (emailOrPhone: string, code: string) =>
  api.post<AuthResponse>('/auth/verify', { emailOrPhone, code }).then((r) => r.data);

export const resendCode = (emailOrPhone: string) =>
  api.post<{ message: string }>('/auth/resend-code', { emailOrPhone }).then((r) => r.data);

export const login = (emailOrPhone: string, password: string) =>
  api.post<AuthResponse>('/auth/login', { emailOrPhone, password }).then((r) => r.data);
