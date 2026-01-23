import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { createPortal } from 'react-dom';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'PEMBELI';
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null); 
  const [showDeleteModal, setShowDeleteModal] = useState(false); 
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'PEMBELI' as 'ADMIN' | 'PEMBELI',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.error || 'Gagal memuat users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');

    try {
      if (editingUser) {
        // send explicit numeric status (1 = active, 0 = inactive)
        const rbacPayload = { ...formData, status: formData.status === 'ACTIVE' ? 1 : 0 };
        await api.put(`/users/${editingUser.id}`, rbacPayload);
      } else {
        await api.post('/auth/register', formData);
      }
      await fetchUsers();
      setShowModal(false);
      setEditingUser(null);
      setFormData({ name: '', username: '', email: '', password: '', role: 'PEMBELI', status: 'ACTIVE' });
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.response?.data?.error || 'Gagal membuat user');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      username: user.username || '',
      email: user.email || '',
      password: '',
      role: user.role || 'PEMBELI',
      status: user.status || 'ACTIVE',
    });
    setShowModal(true);
  };

  const handleDeleteClick = (id: number) => {
    setUserToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setSubmitLoading(true);
    setError('');
    try {
    // delete via RBAC route so Kong injects X-INTERNAL-KEY
    await api.delete(`/users/${userToDelete}`);
      await fetchUsers();
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.error || 'Gagal menghapus user');
    } finally {
      setSubmitLoading(false);
    }
  };

  const cancelDelete = () => {
    setUserToDelete(null);
    setShowDeleteModal(false);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2 text-blue-600 mb-4">
        <img src="/icons/peep_blue.svg" alt="Wallet" className="w-12 h-12" />
        <h1 className="text-3xl font-bold">Manajemen Users</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-medium text-gray-700 mb-4">Cari User</h2>
          <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Ketik nama atau username..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={() => {
              setEditingUser(null);
              setFormData({ name: '', username: '', email: '', password: '', role: 'PEMBELI', status: 'ACTIVE' });
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:from-blue-700 hover:to-blue-50 px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition-all"
          >
            <img src="/icons/add.svg" alt="Add" className="w-6 h-6" />
            Tambah User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-blue-50/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900 border-r border-b border-gray-200">#</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900 border-r border-b border-gray-200">Nama Lengkap</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900 border-r border-b border-gray-200">Username</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900 border-r border-b border-gray-200">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900 border-r border-b border-gray-200">Role / Group</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900 border-r border-b border-gray-200">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900 border-b border-gray-200">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Memuat data...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Belum ada users.</td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 font-medium">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">{user.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">{user.username || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">{user.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">{user.role === 'ADMIN' ? 'Admin' : 'Pembeli'}</td>
                      <td className="px-4 py-3 text-sm border-r border-gray-200">
                        <span
                          className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold text-white ${user.status === 'ACTIVE' ? 'bg-green-600' : 'bg-gray-500'}`}
                        >
                          {user.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="w-8 h-8 flex items-center justify-center rounded border border-blue-400 text-blue-500 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user.id)}
                            className="w-8 h-8 flex items-center justify-center rounded border border-red-400 text-red-500 hover:bg-red-50 transition-colors"
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

      {showModal &&
        createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-9999 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8">
              <div className="flex items-center justify-between p-6 border-b bg-blue-600 border-gray-200 rounded-t-lg">
                  <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center">
                    <img src="/icons/add.svg" alt="Wallet" className="w-20 h-20" />
                  </div>
                  <h2 className="text-3xl font-bold text-white">{editingUser ? 'Edit User' : 'Tambah User Baru'}</h2>
                </div>
                <button onClick={() => { setShowModal(false); setEditingUser(null); }} className="text-gray-300 hover:text-gray-300 text-3xl leading-none">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 flex items-start gap-2">
                    <span className="text-lg">⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan nama lengkap"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={submitLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="contoh@kemendagri.go.id"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={submitLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan username"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      disabled={submitLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Masukkan password"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      disabled={submitLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role / Group</label>
                    <select
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'PEMBELI' })}
                      disabled={submitLoading}
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="PEMBELI">Pembeli</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                      disabled={submitLoading}
                    >
                      <option value="ACTIVE">Aktif</option>
                      <option value="INACTIVE">Nonaktif</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 justify-end mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingUser(null);
                      setError('');
                    }}
                    disabled={submitLoading}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg bg-gray-600  text-white hover:text-gray-600 hover:bg-gray-50 font-medium disabled:opacity-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2 transition-colors"
                  >
                    {submitLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <span>✓</span>
                        Simpan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      {showDeleteModal &&
        createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-9999 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-bold mb-4">Konfirmasi Hapus</h3>
              <p className="text-sm text-gray-700 mb-6">Apakah Anda yakin ingin menghapus user ini? Aksi ini tidak bisa dibatalkan.</p>
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}
              <div className="flex gap-3 justify-end">
                <button onClick={cancelDelete} disabled={submitLoading} className="px-4 py-2 rounded border bg-gray-100">Batal</button>
                <button onClick={confirmDelete} disabled={submitLoading} className="px-4 py-2 rounded bg-red-600 text-white">{submitLoading ? 'Menghapus...' : 'Hapus'}</button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
