import { useState } from 'react';

interface Product {
  id: number;
  namaProduk: string;
  harga: string;
}

const dummyProducts: Product[] = [
  { id: 1, namaProduk: 'Pemutihan Data & Dokumen Kependudukan', harga: 'Rp 5,000' },
  { id: 2, namaProduk: 'Verifikasi Data Kependudukan Berbasis Web', harga: 'Rp 3,000' },
  { id: 3, namaProduk: 'Buku Cetakan Data Agregat Penduduk', harga: 'Rp 10,000' },
];

export default function MasterProductPage() {
  const [products] = useState<Product[]>(dummyProducts);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    namaProduk: '',
    harga: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submit product:', formData);
    setShowModal(false);
  };

  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center gap-2 text-blue-600 mb-4">
            <span className="text-2xl">📦</span>
            <h1 className="text-2xl font-bold">Data Master Produk</h1>
          </div>

          <div className="flex gap-3">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium">
              <span>📋</span>
              Daftar Produk API
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium"
            >
              <span>➕</span>
              Tambah Produk
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Produk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga per Token/Hit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product, index) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{product.namaProduk}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{product.harga}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded">✏️</button>
                      <button className="text-red-600 hover:text-red-800 bg-red-50 px-3 py-1 rounded">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 text-xl">➕</span>
                <h2 className="text-xl font-bold text-gray-800">Tambah Produk Baru</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
                <input
                  type="text"
                  placeholder="Masukkan nama produk"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.namaProduk}
                  onChange={(e) => setFormData({ ...formData, namaProduk: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga per Token / Hit</label>
                <input
                  type="number"
                  placeholder="5000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.harga}
                  onChange={(e) => setFormData({ ...formData, harga: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  💾 Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
