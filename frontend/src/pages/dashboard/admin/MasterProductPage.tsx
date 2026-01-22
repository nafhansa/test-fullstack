import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; // Import portal biar modal aman
import api from '../../../services/api';

interface Product {
  id: number;
  name: string;
  price: number;
}

export default function MasterProductPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

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
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, productData);
      } else {
        await api.post('/products', productData);
      }

      await fetchProducts();
      setShowModal(false);
      setFormData({ name: '', price: '' });
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
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    setProductToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      await api.delete(`/products/${productToDelete}`);
      await fetchProducts();
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (err: any) {
      console.error('Error deleting product:', err);
      alert(err.response?.data?.error || 'Gagal menghapus produk');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({ name: '', price: '' });
    setError('');
  };

  return (
    <div className="p-8 space-y-6">
      
      {/* 1. Header Halaman */}
      <div className="flex items-center gap-3 text-blue-600 mb-6">
        <img src="/icons/box.svg" alt="Box" className="w-10 h-10" />
        <h1 className="text-2xl font-bold">Data Master Produk</h1>
      </div>

      {/* 2. Container Card Utama */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        
        {/* HEADER BIRU (Sesuai Gambar) */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:from-blue-700 hover:to-blue-50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <h2 className="text-lg font-bold">Daftar Produk API</h2>
          </div>
          
          {/* Tombol Tambah (Putih) */}
          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-black hover:bg-blue-50 px-4 py-2 rounded-md flex items-center gap-2 font-medium text-sm transition-colors shadow-sm"
          >
            <span className="font-medium text-lg">+</span>
            Tambah Produk
          </button>
        </div>

        {/* CONTENT TABEL */}
        <div className="p-6">
          <div className="overflow-x-auto border border-gray-200 rounded-sm">
            <table className="min-w-full border-collapse">
              {/* Table Head: Abu-abu muda + Grid Border */}
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 border-r border-b border-gray-200 w-16">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 border-r border-b border-gray-200">
                    Nama Produk
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-700 border-r border-b border-gray-200 w-48">
                    Harga per Token/Hit
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-bold text-gray-700 border-b border-gray-200 w-32">
                    Aksi
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="bg-white">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Belum ada produk. Klik "Tambah Produk" di atas.
                    </td>
                  </tr>
                ) : (
                  products.map((product, index) => (
                    <tr key={product.id} className="hover:bg-blue-50/30 transition-colors">
                      {/* Kolom Nomor */}
                      <td className="px-6 py-4 text-sm text-gray-900 border-r border-b border-gray-200 font-medium">
                        {index + 1}
                      </td>
                      
                      {/* Kolom Nama */}
                      <td className="px-6 py-4 text-sm text-gray-900 border-r border-b border-gray-200">
                        {product.name}
                      </td>
                      
                      {/* Kolom Harga (Rata Tengah) */}
                      <td className="px-6 py-4 text-sm text-gray-900 border-r border-b border-gray-200 text-center font-medium">
                        Rp {product.price.toLocaleString('id-ID')}
                      </td>

                      {/* Kolom Aksi */}
                      <td className="px-6 py-4 text-sm border-b border-gray-200">
                        <div className="flex gap-2 justify-center">
                          {/* Tombol Edit Kotak Biru */}
                          <button 
                            onClick={() => handleEdit(product)}
                            className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded border border-blue-400 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          
                          {/* Tombol Hapus Kotak Merah */}
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded border border-red-400 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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
      </div>

      {/* MODAL DENGAN CREATE PORTAL 
        Agar modal full screen & di atas sidebar
      */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          {/* Container Modal: width di-set max-w-3xl agar cukup lebar untuk 2 kolom */}
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl animate-fade-in-up overflow-hidden">
            
            {/* 1. HEADER: Biru Solid (Sesuai Gambar) */}
            <div className="flex items-center justify-between px-6 py-4 bg-blue-600 border-b border-blue-500">
              <div className="flex items-center gap-2 text-white">
                {/* Ikon Plus Bulat */}
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-lg font-bold tracking-wide">
                  {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                </h2>
              </div>
              <button 
                onClick={handleCloseModal} 
                className="text-white/70 hover:text-white transition-colors text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-8">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100 flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </div>
                )}

                {/* 2. LAYOUT INPUT: Grid 2 Kolom (Sesuai Gambar) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Kolom Kiri: Nama Produk */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Nama Produk
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan nama produk"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  {/* Kolom Kanan: Harga */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Harga per Token / Hit
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="5000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

              </div>

              {/* 3. FOOTER TOMBOL: Rata Kanan (Sesuai Gambar) */}
              <div className="px-8 py-5 flex justify-end gap-3 bg-white border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={loading}
                  className="px-5 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded font-medium text-sm transition-colors shadow-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm shadow-sm transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Konfirmasi Hapus</h2>
              </div>
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }} 
                className="text-gray-400 hover:text-red-500 transition-colors text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-gray-700 text-center mb-6">
                Apakah Anda yakin ingin menghapus produk ini?
                <br />
                <span className="text-sm text-gray-500 mt-2 block">Tindakan ini tidak dapat dibatalkan.</span>
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setProductToDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm transition-colors flex justify-center items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}