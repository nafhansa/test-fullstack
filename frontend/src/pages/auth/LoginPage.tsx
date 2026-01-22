import { useState } from 'react';
import { useLoginMutation } from '../../hooks/useAuthMutation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { mutate, isPending, error } = useLoginMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ email, password });
  };

return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-blue-400 to-white px-4">
      <div className="w-full max-w-md bg-white rounded-[1rem] shadow-2xl px-8 py-12">
        
        <div className="flex justify-center mb-4">
            <img src="/icons/wallet.svg" alt="Wallet" className="w-20 h-20" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">DOMPET PNBP</h1>
          <p className="text-s text-gray-500 leading-relaxed font-medium">
            Digital Online Management & Payment Electronic <br />Transaction
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center border border-red-100">
            {(error as Error).message || "Terjadi kesalahan saat login"}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 ml-1">
              Email
            </label>
            <input
              type="email"
              required
              placeholder="admin@test.com"
              className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 ml-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="Masukkan password"
              className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-200 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform active:scale-[0.98]"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16l4-4m0 0l-4-4m4 4H3m4 4v1a3 3 0 003 3h7a3 3 0 003-3V7a3 3 0 00-3-3h-7a3 3 0 00-3 3v1" />
                </svg>
                <span className="tracking-wide">MASUK</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}