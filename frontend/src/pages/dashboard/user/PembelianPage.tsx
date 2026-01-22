import { useState, useEffect } from 'react';
import api from '../../../services/api';

interface Product {
  id: number;
  name: string;
  price: number;
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
      <div className="bg-white shadow-md flex items-center gap-2 mb-5 p-4 rounded-lg">
      {/* --- Bagian Kiri (Icon Tas & Judul) --- */}
        <img 
          src="/icons/shopping_bag_blue.svg" 
          alt="Shopping Cart Blue" 
          className="w-8 h-8" 
        />
      <h1 className="text-2xl font-bold text-blue-600">Beli Produk</h1>

      {/* --- Bagian Kanan (2 Icon Baru) --- */}
      {/* ml-auto mendorong div ini ke pojok kanan */}
      <div className="ml-auto flex items-center gap-3"> 
        <img 
          src="/icons/bell.svg" 
          alt="Notification" 
          className="w-8 h-8 cursor-pointer hover:opacity-80" 
          />
        <img
          src="/icons/shopping_cart_blue.svg" 
          alt="Shopping Cart Blue" 
          className="w-8 h-8 cursor-pointer hover:opacity-80" 
        />
      </div>
    </div>
      {products.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          Belum ada produk tersedia.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg shadow-lg p-6 text-white">
              <h3 className="text-lg text-center font-semibold mb-4 min-h-[60px]">{product.name}</h3>
              <p className="text-3xl text-center font-bold mb-2">{formatRupiah(product.price)}</p>
              <button 
                onClick={() => handleBeli(product)}
                className="w-full bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              > 
                <img src="/icons/shopping_cart_blue.svg" alt="Shopping Cart Blue" className="w-6 h-6 inline-block mr-2" />
                Beli Sekarang
              </button>
            </div>
          ))}
        </div>
      )}

      {showCheckoutModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-xl shadow-2xl w-full max-h-[90vh] overflow-y-auto transition-all duration-300 ${checkoutResult ? 'max-w-5xl' : 'max-w-lg'}`}>
            {checkoutResult ? (
              <>
                {/* Header Hijau */}
                <div className="bg-green-700 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center">
                      <img src="/icons/bill.svg" alt="Bill" className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Kode Billing SIMPONI</h2>
                  </div>
                  <button 
                    onClick={() => {
                      setShowCheckoutModal(false);
                      setCheckoutResult(null);
                    }} 
                    className="text-white hover:text-gray-200 text-3xl leading-none"
                  >
                    ✕
                  </button>
                </div>

                {/* Content */}
                <div className="p-8">
                  {/* Success Alert */}
                  <div className="bg-green-100 border border-green-400 rounded-md p-4 mb-6 gap-3">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5 text-green-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-green-900 font-bold text-lg">Billing Berhasil Dibuat!</h3>
                    </div>
  
                    {/* Text Content */}
                    <div>
                        <p className="text-green-900 text-sm leading-snug">
                          Berikut informasi kode billing dari sistem <span className="font-bold">SIMPONI Kemenkeu.</span>
                        </p>
                    </div>
                  </div>

                  {/* Billing Info Table */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                    <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
                      <div className="col-span-1 px-6 bg-blue-50 py-4 font-bold text-gray-700 border-r border-gray-200">Kode Billing</div>
                      <div className="col-span-2 px-6 py-4 font-mono font-bold text-lg text-gray-900">{checkoutResult.transaction.kode_billing}</div>
                    </div>
                    <div className="grid grid-cols-3 bg-white border-b border-gray-200">
                      <div className="col-span-1 px-6 bg-blue-50 py-4 font-bold text-gray-700 border-r border-gray-200">Nominal</div>
                      <div className="col-span-2 px-6 py-4 font-bold text-gray-900">{formatRupiah(checkoutResult.transaction.total_amount)}</div>
                    </div>
                    <div className="grid grid-cols-3 bg-gray-50">
                      <div className="col-span-1 px-6 bg-blue-50 py-4 font-bold text-gray-700 border-r border-gray-200">Tanggal Kadaluarsa</div>
                      <div className="col-span-2 px-6 py-4 text-gray-900">{new Date(checkoutResult.transaction.expired_at).toLocaleString('id-ID', { 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}</div>
                    </div>
                  </div>

                  {/* Tata Cara Pembayaran */}
                  <div className="mb-6">
                    <h3 className="text-blue-700 font-bold text-lg mb-4">Tata Cara Pembayaran:</h3>
                    <ol className="space-y-2 text-gray-700 pl-5">
                      <li className="flex gap-3">
                        <span className="font-bold flex-shrink-0">1.</span>
                        <span>Buka aplikasi <strong>BRI / BNI / Mandiri / BSI / Bank lain</strong> yang mendukung pembayaran PNBP SIMPONI.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-bold flex-shrink-0">2.</span>
                        <span>Pilih menu <strong>"Pembayaran -- PNBP -- SIMPONI"</strong>.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-bold flex-shrink-0">3.</span>
                        <span>Masukkan <strong>Kode Billing</strong> di atas.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-bold flex-shrink-0">4.</span>
                        <span>Periksa rincian transaksi dan lakukan pembayaran.</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="font-bold flex-shrink-0">5.</span>
                        <span>Simpan bukti bayar. Token akan otomatis aktif setelah verifikasi oleh sistem.</span>
                      </li>
                    </ol>
                  </div>

                  {/* Button Selesai */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setShowCheckoutModal(false);
                        setCheckoutResult(null);
                      }}
                      className="px-8 py-3 bg-green-700 hover:bg-green-500 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-md"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      Selesai
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Header Checkout */}
                <div className="flex items-center bg-blue-600 justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <img src="/icons/shopping_cart.svg" alt="Shopping Cart" className="w-6 h-6" />
                    <h2 className="text-xl font-bold text-white">Checkout Pembelian</h2>
                  </div>
                  <button onClick={() => setShowCheckoutModal(false)} className="text-white hover:text-gray-200 text-2xl">
                    ✕
                  </button>
                </div>

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

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCheckoutModal(false)}
                    disabled={checkoutLoading !== null}
                    className="px-6 py-2.5 rounded-md bg-gray-500 text-white font-medium hover:bg-gray-600 transition-colors focus:ring-2 focus:ring-gray-300"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading !== null || !quantity || parseInt(quantity) < 1}
                    className="px-6 py-2.5 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 focus:ring-2 focus:ring-blue-300"
                  >
                    {checkoutLoading !== null ? (
                      <>⏳ Proses...</>
                    ) : (
                      <>
                        <img src="/icons/credit_card.svg" alt="" className="w-5 h-5" />
                        Lanjutkan Pembayaran
                      </>
                    )}
                  </button>
                </div>
              </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
