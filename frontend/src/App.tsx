import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';

const HomePage = () => (
  <div className="p-8 text-center">
    <h1 className="text-4xl font-bold text-gray-800 mb-4">Selamat Datang di TokoMicro</h1>
    <p className="text-gray-600">Pusat belanja microservices terlengkap.</p>
  </div>
);

const CartPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Keranjang Belanja</h1>
    <p>Isi keranjang akan tampil di sini.</p>
  </div>
);

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="p-10 text-center">Loading auth...</div>;
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

const PublicRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return null;

  return isAuthenticated ? <Navigate to="/home" replace /> : <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/" element={<LoginPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
              <Route path="home" element={<HomePage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="orders" element={<div className="p-10">Riwayat Transaksi</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;