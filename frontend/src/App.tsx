import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import UsersPage from './pages/dashboard/admin/UsersPage';
import MasterProductPage from './pages/dashboard/admin/MasterProductPage';
import UserDashboardPage from './pages/dashboard/user/UserDashboardPage';
import PembelianPage from './pages/dashboard/user/PembelianPage';
import HistoryPage from './pages/dashboard/user/HistoryPage';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="p-10 text-center">Loading auth...</div>;
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

const PublicRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) return null;

  if (isAuthenticated) {
    const redirectPath = user?.role === 'ADMIN' ? '/dashboard' : '/dashboard/user';
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
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
            <Route element={<DashboardLayout />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="dashboard/admin/users" element={<UsersPage />} />
              <Route path="dashboard/admin/master-product" element={<MasterProductPage />} />
              
              <Route path="dashboard/user" element={<UserDashboardPage />} />
              <Route path="dashboard/user/pembelian" element={<PembelianPage />} />
              <Route path="dashboard/user/history" element={<HistoryPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;