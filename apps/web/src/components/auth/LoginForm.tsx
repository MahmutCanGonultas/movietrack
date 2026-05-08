import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router';
import { authClient } from '@/lib/auth-client';
import { useAuthStore } from '@/store/authStore';

const loginSchema = z.object({
  email: z.string().email('Geçerli bir email girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
});

type LoginData = z.infer<typeof loginSchema>;

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  color: 'white',
  padding: '10px 14px',
  width: '100%',
  outline: 'none',
  fontSize: '14px',
  boxSizing: 'border-box' as const,
};

export function LoginForm() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginData) {
    const { data: result, error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError('root', { message: 'Email veya şifre hatalı' });
      return;
    }

    if (result?.user) {
      setUser({ id: result.user.id, email: result.user.email, name: result.user.name, image: result.user.image ?? null });
      navigate('/');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm text-zinc-400 mb-1.5">Email</label>
        <input {...register('email')} type="email" placeholder="sen@example.com" style={inputStyle} />
        {errors.email && <p className="text-sm mt-1" style={{ color: '#f87171' }}>{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-1.5">Şifre</label>
        <input {...register('password')} type="password" placeholder="••••••••" style={inputStyle} />
        {errors.password && <p className="text-sm mt-1" style={{ color: '#f87171' }}>{errors.password.message}</p>}
      </div>

      {errors.root && <p className="text-sm" style={{ color: '#f87171' }}>{errors.root.message}</p>}

      <div className="text-right">
        <a href="/forgot-password" className="text-xs transition-colors" style={{ color: '#71717a' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#d946ef')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
        >
          Şifremi unuttum
        </a>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2.5 rounded-xl font-semibold transition-all disabled:opacity-50"
        style={{
          background: 'linear-gradient(135deg, #d946ef, #a855f7)',
          color: 'white',
          boxShadow: '0 0 20px rgba(217,70,239,0.3)',
          marginTop: '8px',
        }}
      >
        {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
      </button>
    </form>
  );
}
