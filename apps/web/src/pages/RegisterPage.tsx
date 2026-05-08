import { RegisterForm } from '@/components/auth/RegisterForm';
import { Link, Navigate } from 'react-router';
import { useAuthStore } from '@/store/authStore';

export function RegisterPage() {
  const { user, authLoading } = useAuthStore();
  if (authLoading) return null;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#03000a' }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 600px 400px at 50% 30%, rgba(34,211,238,0.05) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-md relative">
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(34,211,238,0.2)',
            boxShadow: '0 0 40px rgba(34,211,238,0.05)',
          }}
        >
          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#22d3ee' }}>
              Başlayalım
            </p>
            <h1 className="text-3xl font-black text-white">Kayıt Ol</h1>
            <p className="text-zinc-500 text-sm mt-2">
              Zaten hesabın var mı?{' '}
              <Link to="/login" className="hover:text-cyan-300 transition-colors" style={{ color: '#22d3ee' }}>
                Giriş yap
              </Link>
            </p>
          </div>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
