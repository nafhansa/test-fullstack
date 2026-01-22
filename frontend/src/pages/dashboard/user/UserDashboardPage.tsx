import { useState, useEffect } from 'react';
import api from '../../../services/api';

export default function UserDashboardPage() {
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAmount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/transactions/history');
        const transactions = response.data;
        
        const totalAmount = transactions
          .filter((t: any) => t.status === 'SUDAH_DIBAYAR')
          .reduce((sum: number, t: any) => sum + parseFloat(t.total_amount), 0);

        setStats({
          totalTransactions: transactions.length,
          totalAmount
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">Memuat statistik...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard User</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Transaksi</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalTransactions}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Pembelian (Lunas)</h3>
          <p className="text-3xl font-bold text-green-600">{formatRupiah(stats.totalAmount)}</p>
        </div>
      </div>
    </div>
  );
}
