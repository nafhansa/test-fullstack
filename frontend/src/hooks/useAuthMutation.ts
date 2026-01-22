import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const useLoginMutation = () => {
  const { login } = useAuth(); // Ambil function login dari Context
  const navigate = useNavigate();

  return useMutation({
    // Function yang dipanggil saat trigger
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return await authService.login(email, password);
    },
    // Jika SUKSES (200 OK)
    onSuccess: (data) => {
      console.log("Login Berhasil:", data);
      login(data.token, data.user); // Simpan ke Context & LocalStorage
      navigate('/'); // Redirect otomatis
    },
    // Jika ERROR
    onError: (error: any) => {
      console.error("Login Gagal:", error);
      // Gak perlu set state error manual, TanStack udah nyiapin properti 'error'
    }
  });
};