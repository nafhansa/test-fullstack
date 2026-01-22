import { useState, useEffect } from 'react';
import api from '../../../services/api';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

export default function PembelianPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [checkoutResult, setCheckoutResult] = useState<any>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleBeli = (product: Product) => {
    setSelectedProduct(product);
    setQuantity('100');
    setShowCheckoutModal(true);
    setCheckoutResult(null);
  };

  const handleCheckout = async () => {
    if (!selectedProduct) return;

    setCheckoutLoading(selectedProduct.id);
    try {
      const response = await api.post('/transactions/checkout', {
        items: [{
          productId: selectedProduct.id,
          qty: parseInt(quantity)
        }]
      });

      setCheckoutResult(response.data);
    } catch (err: any) {
      console.error('Error checkout:', err);
      alert(err.response?.data?.error || 'Gagal melakukan checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

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
        <div className="text-center text-gray-500">Memuat produk...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Beli Produk</h1>
      
      {products.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          Belum ada produk tersedia.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-4 min-h-[60px]">{product.name}</h3>
              <p className="text-3xl font-bold mb-2">{formatRupiah(product.price)}</p>
              <p className="text-sm mb-4 opacity-90">per Hit/Token</p>
              <button 
                onClick={() => handleBeli(product)}
                className="w-full bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                🛒 Beli Sekarang
              </button>
            </div>
          ))}
        </div>
      )}

      {showCheckoutModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 text-xl">🛒</span>
                <h2 className="text-xl font-bold text-gray-800">Checkout</h2>
              </div>
              <button onClick={() => setShowCheckoutModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            {checkoutResult ? (
              <div className="p-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h3 className="text-green-800 font-bold mb-2">✅ Checkout Berhasil!</h3>
                  <p className="text-green-700 text-sm">Silakan lakukan pembayaran</p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kode Billing:</span>
                    <span className="font-mono font-bold text-blue-600">{checkoutResult.transaction.kode_billing}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold">{formatRupiah(checkoutResult.transaction.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kadaluarsa:</span>
                    <span className="text-sm">{new Date(checkoutResult.transaction.expired_at).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ Simpan kode billing Anda. Hubungi admin untuk melakukan pembayaran.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowCheckoutModal(false);
                    setCheckoutResult(null);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">{selectedProduct.name}</h3>
                  <p className="text-gray-600">{formatRupiah(selectedProduct.price)} / Hit</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Hit/Token</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Harga:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatRupiah(selectedProduct.price * parseInt(quantity || '0'))}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCheckoutModal(false)}
                    disabled={checkoutLoading !== null}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading !== null || !quantity || parseInt(quantity) < 1}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    {checkoutLoading !== null ? '⏳ Proses...' : '✅ Checkout'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
