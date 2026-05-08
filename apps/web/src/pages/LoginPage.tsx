import { LoginForm } from '@/components/auth/LoginForm';
import { Link, Navigate } from 'react-router';
import { useAuthStore } from '@/store/authStore';

export function LoginPage() {
  const { user, authLoading } = useAuthStore();
  if (authLoading) return null;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#03000a' }}>
      {/* Arka plan glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 600px 400px at 50% 30%, rgba(217,70,239,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-md relative">
        {/* Kart */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(217,70,239,0.2)',
            boxShadow: '0 0 40px rgba(217,70,239,0.06)',
          }}
        >
          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#d946ef' }}>
              Hoş Geldin
            </p>
            <h1 className="text-3xl font-black text-white">Giriş Yap</h1>
            <p className="text-zinc-500 text-sm mt-2">
              Hesabın yok mu?{' '}
              <Link to="/register" className="hover:text-fuchsia-400 transition-colors" style={{ color: '#d946ef' }}>
                Kayıt ol
              </Link>
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
