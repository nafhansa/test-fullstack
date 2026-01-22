export default function UserDashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard User</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Pembelian</h3>
          <p className="text-3xl font-bold text-blue-600">15</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Transaksi</h3>
          <p className="text-3xl font-bold text-green-600">Rp 2,500,000</p>
        </div>
      </div>
    </div>
  );
}
