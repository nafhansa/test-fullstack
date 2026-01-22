export default function PembelianPage() {
  const products = [
    { id: 1, nama: 'Pemutihan Data & Dokumen Kependudukan 5,000 Hit', harga: 'Rp 500,000' },
    { id: 2, nama: 'Agregat Data Penduduk 10,000 Hit', harga: 'Rp 900,000' },
    { id: 3, nama: 'Buku Cetakan Data Agregat Penduduk 50,000 Hit', harga: 'Rp 4,000,000' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Beli Produk</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-4 min-h-[60px]">{product.nama}</h3>
            <p className="text-3xl font-bold mb-4">{product.harga}</p>
            <button className="w-full bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              🛒 Beli Sekarang
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
