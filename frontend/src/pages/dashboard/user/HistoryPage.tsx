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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  const filteredTransactions = transactions.filter(t => {
    // Filter by status
    if (filter !== 'Semua' && t.status !== statusMap[filter]) {
      return false;
    }

    // Filter by date range
    const transactionDate = new Date(t.created_at);
    transactionDate.setHours(0, 0, 0, 0); // Reset time to start of day
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (transactionDate < start) return false;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of day
      if (transactionDate > end) return false;
    }

    return true;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'BELUM_DIBAYAR': return 'bg-yellow-400 text-black';
      case 'SUDAH_DIBAYAR': return 'bg-emerald-600 text-white';
      case 'EXPIRED': return 'bg-red-500 text-white';
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
      <div className="flex items-center justify-between mb-6 text-blue-600">
        <div className="flex items-center gap-4">
          <img src="/icons/history_blue.svg" alt="History" className="w-10 h-10" />
          <h1 className="text-3xl pl-2 font-bold">History Transaksi Pembayaran</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 border border-blue-500 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
            <img src="/icons/bell.svg" alt="Notification" className="w-8 h-8" />
          </div>
          <div className="p-2 border border-blue-500 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
            <img src="/icons/shopping_cart_blue.svg" alt="Cart" className="w-8 h-8" />
          </div>    
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-1xl text-gray-600 mb-1">Tanggal Awal</label>
            <input 
              type="date" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-1xl text-gray-600 mb-1">Tanggal Akhir</label>
            <input 
              type="date" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-1xl text-gray-600 mb-1">Status Pembayaran</label>
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
            <button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setFilter('Semua');
              }}
            >
              <img src="/icons/magnifier.svg" alt="Reset" className="w-5 h-5 inline-block mr-2" />
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h2 className="text-xl font-bold text-blue-600 mb-4">Daftar Transaksi Pembayaran</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-100 border-b-4 border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase">#</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase">ID Transaksi</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase">Tanggal</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase">Produk</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase">Total (Rp)</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase">Status Pembayaran</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-black uppercase">Aksi</th>
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
                    <tr 
                      key={transaction.id} 
                      className="odd:bg-gray-100 even:bg-white hover:bg-blue-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-md text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 text-md text-gray-900 font-mono">{transaction.kode_billing}</td>
                      <td className="px-6 py-4 text-md text-gray-900">
                        {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-md text-gray-900">
                        {transaction.items.map((item, i) => (
                          <div key={i}>
                            {item.product_name} ({item.quantity} Hit)
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 text-md text-gray-900">
                        {formatRupiah(transaction.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-md">
                        <span className={`px-3 py-1 rounded-md text-md font-medium ${getStatusColor(transaction.status)}`}>
                          {getStatusLabel(transaction.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-md">
                        <div className="text-md text-gray-500">
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
