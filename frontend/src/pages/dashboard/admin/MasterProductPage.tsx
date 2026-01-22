import { useState, useEffect } from 'react';
import api from '../../../services/api';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

export default function MasterProductPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '999999',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Gagal memuat produk');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const productData = {
        name: formData.name,
        price: parseInt(formData.price),
        stock: parseInt(formData.stock),
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, productData);
      } else {
        await api.post('/products', productData);
      }

      await fetchProducts();
      setShowModal(false);
      setFormData({ name: '', price: '', stock: '999999' });
      setEditingProduct(null);
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.response?.data?.error || 'Gagal menyimpan produk');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;

    try {
      await api.delete(`/products/${id}`);
      await fetchProducts();
    } catch (err: any) {
      console.error('Error deleting product:', err);
      alert(err.response?.data?.error || 'Gagal menghapus produk');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({ name: '', price: '', stock: '999999' });
    setError('');
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
            <button 
              onClick={() => window.open('http://localhost:3002/api-docs', '_blank')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-medium"
            >
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
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Belum ada produk. Klik "Tambah Produk" untuk menambahkan.
                  </td>
                </tr>
              ) : (
                products.map((product, index) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">Rp {product.price.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-800 bg-red-50 px-3 py-1 rounded"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 text-xl">{editingProduct ? '✏️' : '➕'}</span>
                <h2 className="text-xl font-bold text-gray-800">{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
              </div>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama produk"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga per Token / Hit</label>
                <input
                  type="number"
                  required
                  placeholder="5000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  type="number"
                  required
                  placeholder="999999"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? '⏳ Menyimpan...' : '💾 Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
