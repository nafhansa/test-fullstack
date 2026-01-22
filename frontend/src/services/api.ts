import axios from 'axios';
// FIX 1: Tambahkan kata kunci 'type' di sini
import type { AuthResponse } from '../types/auth';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (email: string, password: string, role: 'ADMIN' | 'PEMBELI') => {
    const response = await api.post('/auth/register', { email, password, role });
    return response.data;
  }
};

export default api;