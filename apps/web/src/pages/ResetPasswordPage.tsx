import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router';
import { authClient } from '@/lib/auth-client';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı.'); return; }
    if (password !== confirm) { setError('Şifreler eşleşmiyor.'); return; }
    setLoading(true);
    setError('');
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    setLoading(false);
    if (error) {
      setError('Link geçersiz veya süresi dolmuş. Yeni sıfırlama isteği oluştur.');
    } else {
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    }
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: 'white',
    padding: '10px 14px',
    width: '100%',
    outline: 'none',
    fontSize: '14px',
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 600px 400px at 50% 30%, rgba(139,92,246,0.06) 0%, transparent 70%)' }}
      />
      <div className="w-full max-w-md relative">
        <div
          className="rounded-2xl p-8"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)', boxShadow: '0 0 40px rgba(139,92,246,0.06)' }}
        >
          {done ? (
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <h1 className="text-2xl font-black text-white mb-2">Şifre Güncellendi</h1>
              <p className="text-zinc-500 text-sm">Giriş sayfasına yönlendiriliyorsun...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#8b5cf6' }}>
                  Yeni Şifre
                </p>
                <h1 className="text-3xl font-black text-white">Şifre Belirle</h1>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Yeni Şifre</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Şifre Tekrar</label>
                  <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required style={inputStyle} />
                </div>

                {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50 btn-glow"
                  style={{ marginTop: '8px' }}
                >
                  {loading ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
                </button>
              </form>

              <p className="text-center text-sm text-zinc-600 mt-6">
                <Link to="/forgot-password" className="hover:text-zinc-300 transition-colors">Yeni sıfırlama isteği oluştur</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
