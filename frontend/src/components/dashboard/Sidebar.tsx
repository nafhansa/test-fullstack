import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar(): ReactNode {
  const location = useLocation();
  const { logout, user } = useAuth();

  const adminMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '/icons/dashboard.svg' },
    { path: '/dashboard/admin/users', label: 'Users', icon: '/icons/people.svg' },
    { path: '/dashboard/admin/master-product', label: 'Master Produk', icon: '/icons/docs.svg' },
  ];

  const userMenuItems = [
    { path: '/dashboard/user', label: 'Dashboard', icon: '/icons/dashboard.svg' },
    { path: '/dashboard/user/pembelian', label: 'Pembelian Produk', icon: '/icons/shopping_bag.svg' },
    { path: '/dashboard/user/history', label: 'History Pembayaran', icon: '/icons/history.svg' },
  ];

  const menuItems = user?.role === 'ADMIN' ? adminMenuItems : userMenuItems;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 bg-gradient-to-b from-blue-600 to-blue-700 min-h-screen text-white flex flex-col">
      <div className="p-6 border-b border-blue-500">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8rounded-lg flex items-center justify-center">
            <img src="/icons/wallet_white.svg" alt="Wallet" className="w-20 h-20" />
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
            {item.icon.endsWith('.svg') ? (
              <img src={item.icon} alt={item.label} className="w-5 h-5" />
            ) : (
              <span className="text-xl">{item.icon}</span>
            )}
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
        
        <button
          onClick={logout}
          className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-blue-700 w-full text-left"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16l4-4m0 0l-4-4m4 4H3m4 4v1a3 3 0 003 3h7a3 3 0 003-3V7a3 3 0 00-3-3h-7a3 3 0 00-3 3v1" />
          </svg>
          <span className="font-medium">Logout</span>
        </button>
      </nav>
    </div>
  );
}
