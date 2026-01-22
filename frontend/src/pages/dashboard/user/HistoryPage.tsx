import { useState, useEffect } from 'react';
import api from '../../../services/api';

interface TransactionItem {
  product_name: string;
  quantity: number;
  price_snapshot: number;
}

interface Transaction {
  id: number;
  kode_billing: string;
  total_amount: number;
  status: 'BELUM_DIBAYAR' | 'SUDAH_DIBAYAR' | 'EXPIRED';
  expired_at: string;
  created_at: string;
  items: TransactionItem[];
}

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('Semua');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/transactions/history');
      setTransactions(response.data);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const statusMap: Record<string, string> = {
    'Semua': 'Semua',
    'Menunggu Pembayaran': 'BELUM_DIBAYAR',
    'Sudah Dibayar': 'SUDAH_DIBAYAR',
    'Expired': 'EXPIRED'
  };

  const filteredTransactions = filter === 'Semua' 
    ? transactions 
    : transactions.filter(t => t.status === statusMap[filter]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'BELUM_DIBAYAR': return 'bg-yellow-100 text-yellow-700';
      case 'SUDAH_DIBAYAR': return 'bg-green-100 text-green-700';
      case 'EXPIRED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'BELUM_DIBAYAR': return 'Menunggu Pembayaran';
      case 'SUDAH_DIBAYAR': return 'Sudah Dibayar';
      case 'EXPIRED': return 'Expired';
      default: return status;
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">History Transaksi Pembayaran</h1>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-700 mb-4">Filter</h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Tanggal Awal</label>
            <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Tanggal Akhir</label>
            <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Status Pembayaran</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option>Semua</option>
              <option>Menunggu Pembayaran</option>
              <option>Sudah Dibayar</option>
              <option>Expired</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
              🔍 Filter
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Daftar Transaksi Pembayaran</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Transaksi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total (Rp)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status Pembayaran</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Belum ada transaksi.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction, index) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">{transaction.kode_billing}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.items.map((item, i) => (
                          <div key={i}>
                            {item.product_name} ({item.quantity} Hit)
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatRupiah(transaction.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {getStatusLabel(transaction.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-xs text-gray-500">
                          Exp: {new Date(transaction.expired_at).toLocaleString('id-ID')}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
