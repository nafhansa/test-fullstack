import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, productsRes, transactionsRes] = await Promise.all([
          api.get('/auth/users'),
          api.get('/products'),
          api.get('/transactions/history')
        ]);

        setStats({
          totalUsers: usersRes.data.length,
          totalProducts: productsRes.data.length,
          totalTransactions: transactionsRes.data.length
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">Memuat statistik...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 text-blue-600 mb-4">
            <img src="/icons/dashboard_blue.svg" alt="Dashboard" className="w-10 h-10" />
            <h1 className="text-3xl pl-2 font-bold">Dashboard Admin</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Products</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalProducts}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Transactions</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.totalTransactions}</p>
        </div>
      </div>
    </div>
  );
}
