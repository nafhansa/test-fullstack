export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">150</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Products</h3>
          <p className="text-3xl font-bold text-green-600">48</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Transactions</h3>
          <p className="text-3xl font-bold text-purple-600">1,234</p>
        </div>
      </div>
    </div>
  );
}
