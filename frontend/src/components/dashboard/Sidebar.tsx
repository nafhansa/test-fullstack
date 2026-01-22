import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar(): ReactNode {
  const location = useLocation();
  const { logout, user } = useAuth();

  const adminMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/dashboard/admin/users', label: 'Users', icon: '👥' },
    { path: '/dashboard/admin/master-product', label: 'Master Produk', icon: '📦' },
  ];

  const userMenuItems = [
    { path: '/dashboard/user', label: 'Dashboard', icon: '📊' },
    { path: '/dashboard/user/pembelian', label: 'Pembelian Produk', icon: '🛒' },
    { path: '/dashboard/user/history', label: 'History Pembayaran', icon: '📜' },
  ];

  const menuItems = user?.role === 'ADMIN' ? adminMenuItems : userMenuItems;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 bg-gradient-to-b from-blue-600 to-blue-700 min-h-screen text-white flex flex-col">
      <div className="p-6 border-b border-blue-500">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-blue-600 text-xl">📁</span>
          </div>
          <h1 className="text-xl font-bold">DOMPET PNBP</h1>
        </div>
      </div>

      <nav className="flex-1 py-4">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-6 py-3 transition-colors ${
              isActive(item.path)
                ? 'bg-blue-800 border-l-4 border-white'
                : 'hover:bg-blue-700'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
        
        <button
          onClick={logout}
          className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-blue-700 w-full text-left"
        >
          <span className="text-xl">🚪</span>
          <span className="font-medium">Logout</span>
        </button>
      </nav>
    </div>
  );
}
