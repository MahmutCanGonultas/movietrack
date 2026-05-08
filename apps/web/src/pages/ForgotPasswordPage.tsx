import { useState } from 'react';
import { Link } from 'react-router';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, redirectTo: `${window.location.origin}/reset-password` }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as any)?.error || 'Bir hata oluştu, tekrar dene.');
      } else {
        setSent(true);
      }
    } catch {
      setError('Sunucuya bağlanılamadı. Tekrar dene.');
    }
    setLoading(false);
  }

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
          {sent ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📬</div>
              <h1 className="text-2xl font-black text-white mb-2">Email Gönderildi</h1>
              <p className="text-zinc-500 text-sm mb-6">
                <span className="text-zinc-300">{email}</span> adresine şifre sıfırlama linki gönderdik.
                Spam klasörünü de kontrol et.
              </p>
              <Link to="/login" className="text-sm font-semibold" style={{ color: '#8b5cf6' }}>
                ← Giriş sayfasına dön
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#8b5cf6' }}>
                  Şifre Sıfırlama
                </p>
                <h1 className="text-3xl font-black text-white">Şifremi Unuttum</h1>
                <p className="text-zinc-500 text-sm mt-2">
                  Email adresini gir, sıfırlama linki gönderelim.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sen@example.com"
                    required
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      color: 'white',
                      padding: '10px 14px',
                      width: '100%',
                      outline: 'none',
                      fontSize: '14px',
                    }}
                  />
                </div>

                {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50 btn-glow"
                  style={{ marginTop: '8px' }}
                >
                  {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
                </button>
              </form>

              <p className="text-center text-sm text-zinc-600 mt-6">
                <Link to="/login" className="hover:text-zinc-300 transition-colors">← Giriş sayfasına dön</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
