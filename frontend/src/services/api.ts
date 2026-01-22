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
    // MOCK DATA
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    if (email === "user@store.com" && password === "user123") {
      return {
        token: "fake-jwt-token-user",
        user: { id: 2, email: "user@store.com", role: "PEMBELI" }
      };
    }
    
    if (email === "admin@store.com" && password === "admin123") {
      return {
        token: "fake-jwt-token-admin",
        user: { id: 1, email: "admin@store.com", role: "ADMIN" }
      };
    }

    throw new Error("Email atau password salah (Mock)");
  },

  // FIX 2: Tambahkan underscore (_) agar TypeScript tidak komplain variabel tidak terpakai
  // ATAU console.log variabel tersebut
  register: async (email: string, password: string, role: 'ADMIN' | 'PEMBELI') => {
    console.log("Mock Register:", email, password, role); // Biar variabelnya 'terpakai'
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true };
  }
};

export default api;