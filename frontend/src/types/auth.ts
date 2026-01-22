export interface User {
  id: number;
  email: string;
  role: 'ADMIN' | 'PEMBELI';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
}