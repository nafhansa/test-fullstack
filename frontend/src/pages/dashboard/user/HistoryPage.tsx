import { useState } from 'react';

interface Transaction {
  id: string;
  tanggal: string;
  produk: string;
  total: string;
  status: 'Menunggu Pembayaran' | 'Sudah Dibayar' | 'Expired';
}

const dummyTransactions: Transaction[] = [
  { id: 'TXD123', tanggal: '27/10/2025', produk: 'Pemutihan NIK & Dokumen (100 Hit)', total: '500,000', status: 'Menunggu Pembayaran' },
  { id: 'TXD124', tanggal: '25/10/2025', produk: 'Pemutihan NIK & Dokumen (50 Hit)', total: '250,000', status: 'Sudah Dibayar' },
  { id: 'TXD125', tanggal: '24/10/2025', produk: 'Pemutihan NIK & Dokumen (200 Hit)', total: '1,000,000', status: 'Expired' },
];

export default function HistoryPage() {
  const [transactions] = useState<Transaction[]>(dummyTransactions);
  const [filter, setFilter] = useState('Semua');

  const filteredTransactions = filter === 'Semua' 
    ? transactions 
    : transactions.filter(t => t.status === filter);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Menunggu Pembayaran': return 'bg-yellow-100 text-yellow-700';
      case 'Sudah Dibayar': return 'bg-green-100 text-green-700';
      case 'Expired': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
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
                {filteredTransactions.map((transaction, index) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{transaction.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{transaction.tanggal}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{transaction.produk}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{transaction.total}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded">
                        📄 Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
